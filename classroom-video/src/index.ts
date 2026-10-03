import { DurableObject } from "cloudflare:workers";
import { campusOfDevice, createTicket, displayNameForDevice, parseDevices, resolveDeviceIdentity, tokensEqual, verifyTicket } from "./auth";

type Attachment = { id: string; name: string; mode: "active" | "standby"; connectedAt: number; lastSeenAt: number; wakeRequestedAt?: number; urgentTarget?: string; directPeer?: string; directMediaAt?: number };
type SignalMessage = { type: "signal"; to: string; description?: unknown; candidate?: unknown; restart?: boolean };
type ClientMessage = SignalMessage | { type: "call"; callId: string; to: string } | { type: "ack"; callId: string } | { type: "urgent-end"; to: string } | { type: "direct-media"; connected: boolean } |
  { type: "remote-mic"; to: string; enabled: boolean } |
  { type: "list-devices" } | { type: "wake-device"; to: string } |
  { type: "media-state"; audio: boolean; video: boolean } | { type: "ping" };
type IceServer = { urls: string | string[]; username?: string; credential?: string };
const V032_DEPLOYED_AT = 1_790_532_911_000;

function withoutBlockedBrowserPorts(servers: IceServer[]): IceServer[] {
  return servers.map((server) => ({
    ...server,
    urls: (Array.isArray(server.urls) ? server.urls : [server.urls]).filter((url) => !/:53(?:\?|$)/.test(url))
  })).filter((server) => server.urls.length > 0);
}

async function createIceServers(env: Env): Promise<IceServer[]> {
  if (env.TURN_KEY_ID && env.TURN_KEY_API_TOKEN) {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { "authorization": `Bearer ${env.TURN_KEY_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ ttl: 46800 })
    });
    if (!response.ok) {
      console.error(JSON.stringify({ event: "turn_credential_failure", status: response.status }));
      throw new Error("TURN credential generation failed");
    }
    const body = await response.json<{ iceServers?: IceServer[] }>();
    if (!Array.isArray(body.iceServers) || body.iceServers.length < 2) throw new Error("TURN credential response was incomplete");
    return withoutBlockedBrowserPorts(body.iceServers);
  }
  if (env.ICE_SERVERS_JSON) {
    const configured = JSON.parse(env.ICE_SERVERS_JSON) as IceServer[];
    if (Array.isArray(configured) && configured.length > 0) return withoutBlockedBrowserPorts(configured);
  }
  throw new Error("TURN is not configured");
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

function randomCredential(bytes = 32): string {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function socketAttachment(socket: WebSocket): Attachment | null {
  const value: unknown = socket.deserializeAttachment();
  if (!value || typeof value !== "object") return null;
  const attachment = value as Partial<Attachment>;
  return typeof attachment.id === "string" && typeof attachment.name === "string" &&
    (attachment.mode === "active" || attachment.mode === "standby") ? attachment as Attachment : null;
}

export class VideoRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS calls (id TEXT PRIMARY KEY, sender TEXT NOT NULL, created_at INTEGER NOT NULL, acknowledged_by TEXT, acknowledged_at INTEGER)");
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS registered_devices (installation_id TEXT PRIMARY KEY, id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, credential TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS registration_attempts (ip TEXT NOT NULL, created_at INTEGER NOT NULL)");
      this.ctx.storage.sql.exec("CREATE INDEX IF NOT EXISTS registration_attempts_ip_time ON registration_attempts(ip, created_at)");
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS registry_meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL)");
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS retired_legacy_devices (id TEXT PRIMARY KEY, migrated_to TEXT NOT NULL, retired_at INTEGER NOT NULL)");
      this.ctx.storage.sql.exec("INSERT OR IGNORE INTO registry_meta (key, value) VALUES ('device_sequence', 0)");
      this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS room_device_names (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/register") return this.registerDevice(request);
    if (request.method === "POST" && url.pathname === "/authenticate") return this.authenticateDevice(request);
    if (request.method === "POST" && url.pathname === "/legacy-status") return this.legacyStatus(request);
    if (request.headers.get("upgrade") !== "websocket") return new Response("WebSocket required", { status: 426 });
    const id = request.headers.get("x-device-id");
    const encodedName = request.headers.get("x-device-name");
    const mode = request.headers.get("x-device-mode") === "standby" ? "standby" : "active";
    let name = "";
    try { name = decodeURIComponent(encodedName ?? ""); } catch { return new Response("Unauthorized", { status: 401 }); }
    if (!id || !name) return new Response("Unauthorized", { status: 401 });
    if (this.isLegacyRetired(id)) return new Response("Retired device", { status: 401 });
    this.ctx.storage.sql.exec("INSERT INTO room_device_names (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name", id, name);

    const urgentTarget = request.headers.get("x-device-urgent-target") || undefined;
    if (urgentTarget && (urgentTarget === id || !this.peers(id).some(peer => peer.id === urgentTarget && !peer.urgentTarget && !this.directPeerFor(urgentTarget, id)))) return new Response("Target unavailable", { status: 409 });
    for (const current of this.ctx.getWebSockets(`device:${id}`)) this.closeSocket(current, 4001, "Replaced by a new connection");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [`device:${id}`]);
    const connectedAt = Date.now();
    server.serializeAttachment({ id, name, mode, ...(urgentTarget ? { urgentTarget } : {}), connectedAt, lastSeenAt: connectedAt } satisfies Attachment);
    await this.ensurePresenceAlarm();
    this.safeSend(server, { type: "welcome", self: { id, name }, mode, directPeer: this.directPeerFor(id), peers: this.peers(id) });
    // A targeted recovery must not cascade into waking every other standby tablet.
    if (mode === "active" && !urgentTarget && request.headers.get("x-device-wake-mode") !== "targeted") this.broadcast({ type: "wake", from: { id, name } }, id, "standby");
    this.broadcastPresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  private async registerDevice(request: Request): Promise<Response> {
    const body: { installationId?: string; preferredName?: string; ip?: string; verifiedLegacyId?: string; verifiedRegisteredId?: string; recoveryLegacyId?: string } =
      await request.json<{ installationId?: string; preferredName?: string; ip?: string; verifiedLegacyId?: string; verifiedRegisteredId?: string; recoveryLegacyId?: string }>().catch(() => ({}));
    if (!body.installationId || !/^[a-f0-9-]{32,64}$/i.test(body.installationId)) return json({ error: "登録情報が不正です" }, 400);
    const existing = this.ctx.storage.sql.exec<{ id: string; name: string; credential: string; created_at: number }>(
      "SELECT id, name, credential, created_at FROM registered_devices WHERE installation_id = ?", body.installationId
    ).toArray()[0];
    if (existing) {
      if (body.verifiedLegacyId && body.verifiedLegacyId !== existing.id) this.retireLegacyDevice(body.verifiedLegacyId, existing.id);
      if (existing.created_at < V032_DEPLOYED_AT && body.verifiedRegisteredId === existing.id && body.recoveryLegacyId && body.recoveryLegacyId !== existing.id) {
        this.retireLegacyDevice(body.recoveryLegacyId, existing.id);
      }
      return json({ device: { id: existing.id, name: existing.name }, credential: existing.credential });
    }
    const now = Date.now(), ip = (body.ip || "unknown").slice(0, 80), since = now - 86_400_000;
    this.ctx.storage.sql.exec("DELETE FROM registration_attempts WHERE created_at < ?", since);
    const recent = this.ctx.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM registration_attempts WHERE ip = ?", ip).toArray()[0]?.count ?? 0;
    const total = this.ctx.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM registered_devices").toArray()[0]?.count ?? 0;
    if (recent >= 30 || total >= 200) return json({ error: "自動登録の上限に達しました。管理者へ連絡してください" }, 429);
    const sequence = (this.ctx.storage.sql.exec<{ value: number }>("SELECT value FROM registry_meta WHERE key = 'device_sequence'").toArray()[0]?.value ?? 0) + 1;
    const id = `device-${randomCredential(12).toLowerCase()}`, credential = randomCredential();
    const preferredName = typeof body.preferredName === "string" ? body.preferredName.trim().slice(0, 24) : "";
    const name = preferredName || `STEP端末${sequence}`;
    this.ctx.storage.sql.exec("UPDATE registry_meta SET value = ? WHERE key = 'device_sequence'", sequence);
    this.ctx.storage.sql.exec("INSERT INTO registered_devices (installation_id, id, name, credential, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", body.installationId, id, name, credential, now, now);
    this.ctx.storage.sql.exec("INSERT INTO registration_attempts (ip, created_at) VALUES (?, ?)", ip, now);
    if (body.verifiedLegacyId && body.verifiedLegacyId !== id) this.retireLegacyDevice(body.verifiedLegacyId, id);
    return json({ device: { id, name }, credential }, 201);
  }

  private async legacyStatus(request: Request): Promise<Response> {
    const body: { deviceId?: string } = await request.json<{ deviceId?: string }>().catch(() => ({}));
    return json({ retired: Boolean(body.deviceId && this.isLegacyRetired(body.deviceId)) });
  }

  private isLegacyRetired(id: string): boolean {
    return Boolean(this.ctx.storage.sql.exec<{ id: string }>("SELECT id FROM retired_legacy_devices WHERE id = ?", id).toArray()[0]);
  }

  private retireLegacyDevice(id: string, migratedTo: string): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO retired_legacy_devices (id, migrated_to, retired_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET migrated_to = excluded.migrated_to, retired_at = excluded.retired_at",
      id, migratedTo, Date.now()
    );
    for (const socket of this.ctx.getWebSockets(`device:${id}`)) this.closeSocket(socket, 4003, "Device migrated");
    this.broadcastPresence();
  }

  private async authenticateDevice(request: Request): Promise<Response> {
    const body: { deviceId?: string; credential?: string; displayName?: string } =
      await request.json<{ deviceId?: string; credential?: string; displayName?: string }>().catch(() => ({}));
    if (!body.deviceId || !body.credential) return json({ error: "端末設定が必要です" }, 401);
    const device = this.ctx.storage.sql.exec<{ id: string; name: string; credential: string }>(
      "SELECT id, name, credential FROM registered_devices WHERE id = ?", body.deviceId
    ).toArray()[0];
    if (!device || !(await tokensEqual(body.credential, device.credential))) return json({ error: "端末を確認できません" }, 401);
    const requestedName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (requestedName.length > 24) return json({ error: "端末名は24文字以内にしてください" }, 400);
    const name = requestedName || device.name;
    if (name !== device.name) this.ctx.storage.sql.exec("UPDATE registered_devices SET name = ?, updated_at = ? WHERE id = ?", name, Date.now(), device.id);
    return json({ device: { id: device.id, name } });
  }

  webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): void {
    const sender = socketAttachment(socket);
    if (!sender || typeof raw !== "string" || raw.length > 32_768) return;
    let message: ClientMessage;
    try { message = JSON.parse(raw) as ClientMessage; } catch { return; }
    if (!message || typeof message !== "object") return;
    if (message.type === "ping") {
      sender.lastSeenAt = Date.now();
      socket.serializeAttachment(sender);
      this.ctx.waitUntil(this.ensurePresenceAlarm());
      this.safeSend(socket, { type: "pong", at: sender.lastSeenAt });
      return;
    }
    if (message.type === "list-devices" || message.type === "wake-device") {
      if (!this.ctx.getWebSockets(`device:${sender.id}`).includes(socket) || !this.isLiveSocket(socket, sender.mode)) return;
      if (message.type === "list-devices") {
        this.sendDeviceList(socket, sender.id);
        return;
      }
      if (typeof message.to !== "string" || !message.to || message.to === sender.id) {
        this.safeSend(socket, { type: "wake-result", to: typeof message.to === "string" ? message.to : "", status: "unavailable" });
        return;
      }
      const target = this.ctx.getWebSockets(`device:${message.to}`).find(candidate => this.isLiveSocket(candidate, "standby"));
      const targetInfo = target && socketAttachment(target);
      if (!target || !targetInfo || (targetInfo.wakeRequestedAt && Date.now() - targetInfo.wakeRequestedAt < 30_000)) {
        this.safeSend(socket, { type: "wake-result", to: message.to, status: "unavailable" });
        return;
      }
      const delivered = this.safeSend(target, { type: "wake", from: { id: sender.id, name: sender.name }, manual: true });
      if (delivered) target.serializeAttachment({ ...targetInfo, wakeRequestedAt: Date.now() });
      this.safeSend(socket, { type: "wake-result", to: message.to, status: delivered ? "requested" : "unavailable" });
      return;
    }
    if (sender.mode !== "active") return;
    if (message.type === "direct-media") {
      if (sender.urgentTarget && message.connected === true && this.isLiveSocket(socket, "active")) socket.serializeAttachment({ ...sender, directMediaAt: Date.now() });
      return;
    }
    if (message.type === "urgent-end") {
      if (!this.isLiveSocket(socket, "active") || this.directPeerFor(sender.id) !== message.to) return;
      const phoneId = sender.urgentTarget ? sender.id : message.to;
      for (const phone of this.ctx.getWebSockets(`device:${phoneId}`)) this.closeSocket(phone, 4003, "Direct call ended");
      this.broadcastPresence();
      return;
    }
    if ((message.type === "signal" || message.type === "call" || message.type === "remote-mic") && typeof message.to === "string") {
      const target = this.peers(sender.id).find(peer => peer.id === message.to);
      if ((this.directPeerFor(sender.id) && this.directPeerFor(sender.id) !== message.to) || (this.directPeerFor(message.to) && this.directPeerFor(message.to) !== sender.id)) return;
      if ((sender.urgentTarget && sender.urgentTarget !== message.to) || (target?.urgentTarget && target.urgentTarget !== sender.id)) return;
      // Direct participants use their own microphone buttons; remote activation is unnecessary.
      if (message.type === "remote-mic" && (sender.urgentTarget || target?.urgentTarget)) return;
    }
    if (message.type === "remote-mic") {
      if (typeof message.to !== "string" || message.to === sender.id || typeof message.enabled !== "boolean") return;
      const now = Date.now();
      const isCurrent = (candidate: WebSocket) => {
        const peer = socketAttachment(candidate);
        return candidate.readyState === WebSocket.OPEN && peer?.mode === "active" &&
          Number.isFinite(peer.lastSeenAt) && peer.lastSeenAt >= now - 70_000;
      };
      // Membership is scoped to this room; closed/replaced/standby sockets cannot act.
      if (!this.ctx.getWebSockets(`device:${sender.id}`).includes(socket) || !isCurrent(socket)) return;
      const target = this.ctx.getWebSockets(`device:${message.to}`).find(isCurrent);
      if (target) this.safeSend(target, { type: "remote-mic", enabled: message.enabled, from: sender.id, fromName: sender.name });
      return;
    }
    if (message.type === "media-state") {
      if (typeof message.audio !== "boolean" || typeof message.video !== "boolean") return;
      this.broadcast({ type: "media-state", from: sender.id, audio: message.audio, video: message.video }, sender.id, "active");
      return;
    }
    if (message.type === "signal") {
      if (typeof message.to !== "string" || message.to === sender.id || (!message.description && !message.candidate && message.restart !== true)) return;
      this.sendTo(message.to, { ...message, from: sender.id, fromName: sender.name });
      return;
    }
    if (message.type === "call") {
      if (typeof message.callId !== "string" || !/^[a-f0-9-]{36}$/.test(message.callId) ||
          typeof message.to !== "string" || message.to === sender.id || !this.hasActiveDevice(message.to)) return;
      const recent = this.ctx.storage.sql.exec<{ created_at: number }>("SELECT created_at FROM calls WHERE sender = ? ORDER BY created_at DESC LIMIT 1", sender.id).toArray()[0];
      if (recent && Date.now() - recent.created_at < 10_000) { this.safeSend(socket, { type: "cooldown" }); return; }
      this.ctx.storage.sql.exec("INSERT INTO calls (id, sender, created_at) VALUES (?, ?, ?)", message.callId, sender.id, Date.now());
      this.sendTo(message.to, { type: "call", callId: message.callId, from: sender });
      return;
    }
    if (message.type === "ack") {
      if (typeof message.callId !== "string") return;
      const call = this.ctx.storage.sql.exec<{ sender: string }>("SELECT sender FROM calls WHERE id = ? AND acknowledged_at IS NULL", message.callId).toArray()[0];
      if (!call || call.sender === sender.id) return;
      const caller = this.peers(sender.id).find(peer => peer.id === call.sender);
      if (caller?.urgentTarget && caller.urgentTarget !== sender.id) return;
      this.ctx.storage.sql.exec("UPDATE calls SET acknowledged_by = ?, acknowledged_at = ? WHERE id = ?", sender.id, Date.now(), message.callId);
      this.sendTo(call.sender, { type: "ack", callId: message.callId, by: sender });
      const acknowledgingCampus = campusOfDevice(sender.id);
      if (acknowledgingCampus) this.broadcastToCampus(acknowledgingCampus, { type: "call-acknowledged", callId: message.callId });
    }
  }

  webSocketClose(_socket: WebSocket): void { this.broadcastPresence(); }
  webSocketError(socket: WebSocket): void { this.closeSocket(socket, 1011, "Socket error"); this.broadcastPresence(); }

  async alarm(): Promise<void> {
    this.broadcastPresence();
    if (this.ctx.getWebSockets().some((socket) => socket.readyState === WebSocket.OPEN)) {
      await this.setNextPresenceAlarm();
    }
  }

  private async setNextPresenceAlarm(): Promise<void> {
    if (this.ctx.getWebSockets().some(socket => this.isLiveSocket(socket, "active") && socketAttachment(socket)?.urgentTarget)) await this.ctx.storage.setAlarm(Date.now() + 10_000);
    else await this.ctx.storage.setAlarm(Date.now() + 30_000);
  }

  private async ensurePresenceAlarm(): Promise<void> {
    if (await this.ctx.storage.getAlarm() === null) await this.setNextPresenceAlarm();
  }

  private peers(exclude?: string): Attachment[] {
    const peers = new Map<string, Attachment>();
    const staleBefore = Date.now() - 70_000;
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      const peer = socketAttachment(socket);
      if (peer && (peer.lastSeenAt || peer.connectedAt) < staleBefore) {
        this.closeSocket(socket, 4002, "Presence timeout");
        continue;
      }
      if (!peer || peer.mode !== "active" || peer.id === exclude) continue;
      const previous = peers.get(peer.id);
      if (!previous || previous.connectedAt < peer.connectedAt) peers.set(peer.id, peer);
    }
    return [...peers.values()].map(({ id, name, mode, connectedAt, lastSeenAt, urgentTarget }) => ({ id, name, mode, connectedAt, lastSeenAt, ...(urgentTarget ? { urgentTarget } : {}), ...(this.directPeerFor(id) ? { directPeer: this.directPeerFor(id) } : {}) }));
  }
  private safeSend(socket: WebSocket, value: unknown): boolean {
    if (socket.readyState !== WebSocket.OPEN) return false;
    try { socket.send(typeof value === "string" ? value : JSON.stringify(value)); return true; }
    catch (error) { console.warn(JSON.stringify({ event: "websocket_send_skipped", error: String(error) })); return false; }
  }
  private closeSocket(socket: WebSocket, code: number, reason: string): void {
    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) return;
    try { socket.close(code, reason); } catch { /* already closing */ }
  }
  private directPeerFor(id: string, excludePhone?: string): string | undefined {
    for (const socket of this.ctx.getWebSockets()) {
      if (!this.isLiveSocket(socket, "active")) continue;
      const peer = socketAttachment(socket);
      if (!peer?.urgentTarget || peer.id === excludePhone) continue;
      if (peer.id === id) return peer.urgentTarget;
      if (peer.urgentTarget === id) return peer.id;
    }
    return undefined;
  }
  private broadcastPresence(): void {
    // Losing the receiver ends the temporary phone session rather than reconnecting forever.
    for (const socket of this.ctx.getWebSockets()) {
      const peer = socketAttachment(socket);
      if (peer?.urgentTarget && this.isLiveSocket(socket, "active") && Date.now() - (peer.directMediaAt || peer.connectedAt) > 45_000) this.closeSocket(socket, 4003, "Direct media timeout");
      if (peer?.urgentTarget && this.isLiveSocket(socket, "active") && !this.ctx.getWebSockets(`device:${peer.urgentTarget}`).some(target => this.isLiveSocket(target, "active"))) this.closeSocket(socket, 4003, "Receiver disconnected");
    }
    for (const socket of this.ctx.getWebSockets()) {
      const peer = socketAttachment(socket);
      if (peer) this.safeSend(socket, { type: "presence", directPeer: this.directPeerFor(peer.id), peers: this.peers(peer.id) });
    }
    const devices = this.deviceDirectory();
    for (const socket of this.ctx.getWebSockets()) {
      const peer = socketAttachment(socket);
      if (peer && this.isLiveSocket(socket, peer.mode)) this.safeSend(socket, { type: "device-list", devices: devices.filter(device => device.id !== peer.id) });
    }
  }
  private isLiveSocket(socket: WebSocket, mode: Attachment["mode"]): boolean {
    const peer = socketAttachment(socket);
    return socket.readyState === WebSocket.OPEN && peer?.mode === mode &&
      Number.isFinite(peer.lastSeenAt) && peer.lastSeenAt >= Date.now() - 70_000;
  }
  private deviceDirectory(): { id: string; name: string; status: "active" | "standby" | "offline"; direct?: boolean }[] {
    const devices = new Map<string, { id: string; name: string; status: "active" | "standby" | "offline"; direct?: boolean }>();
    // Only names/IDs leave the room; credentials and installation IDs are never selected.
    const known = this.ctx.storage.sql.exec<{ id: string; name: string }>(
      "SELECT id, name FROM room_device_names WHERE id NOT IN (SELECT id FROM retired_legacy_devices) UNION ALL SELECT id, name FROM registered_devices"
    ).toArray();
    for (const device of known) devices.set(device.id, { id: device.id, name: device.name, status: "offline" });
    for (const socket of this.ctx.getWebSockets()) {
      const peer = socketAttachment(socket);
      if (peer && this.isLiveSocket(socket, peer.mode)) devices.set(peer.id, { id: peer.id, name: peer.name, status: peer.mode, ...(this.directPeerFor(peer.id) ? { direct: true } : {}) });
    }
    return [...devices.values()];
  }
  private sendDeviceList(socket: WebSocket, exclude: string): void {
    this.safeSend(socket, { type: "device-list", devices: this.deviceDirectory().filter(device => device.id !== exclude) });
  }
  private sendTo(id: string, value: unknown): void { for (const socket of this.ctx.getWebSockets(`device:${id}`)) this.safeSend(socket, value); }
  private hasActiveDevice(id: string): boolean {
    return this.ctx.getWebSockets(`device:${id}`).some((socket) => socket.readyState === WebSocket.OPEN && socketAttachment(socket)?.mode === "active");
  }
  private broadcastToCampus(campus: "jinryo" | "otemachi", value: unknown): void {
    for (const socket of this.ctx.getWebSockets()) if (campusOfDevice(socketAttachment(socket)?.id ?? "") === campus) this.safeSend(socket, value);
  }
  private broadcast(value: unknown, exclude?: string, mode?: Attachment["mode"]): void {
    for (const socket of this.ctx.getWebSockets()) {
      const peer = socketAttachment(socket);
      if (peer?.id !== exclude && (!mode || peer?.mode === mode)) this.safeSend(socket, value);
    }
  }
}

async function sessionResponse(request: Request, env: Env): Promise<Response> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const body: { deviceId?: string; displayName?: string } = await request.json<{ deviceId?: string; displayName?: string }>().catch(() => ({}));
  if (!body.deviceId || !token) return json({ error: "端末設定が必要です" }, 401);
  const requestedName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (requestedName.length > 24) return json({ error: "端末名は24文字以内にしてください" }, 400);
  let canonicalDevice: { id: string; name: string } | null = null;
  const registry = env.ROOMS.getByName("step-main");
  const registered = await registry.fetch("https://registry.internal/authenticate", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: body.deviceId, credential: token, displayName: requestedName })
  });
  if (registered.ok) canonicalDevice = (await registered.json<{ device: { id: string; name: string } }>()).device;
  if (!canonicalDevice) {
    let devices;
    try { devices = parseDevices(env.DEVICE_TOKENS); } catch (error) { console.error(JSON.stringify({ event: "invalid_device_config", error: String(error) })); return json({ error: "サーバー設定エラー" }, 500); }
    const identity = resolveDeviceIdentity(body.deviceId, devices);
    if (!identity || !(await tokensEqual(token, identity.configured.token))) return json({ error: "端末を確認できません" }, 401);
    const legacyState = await registry.fetch("https://registry.internal/legacy-status", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: identity.canonical.id })
    });
    const { retired } = await legacyState.json<{ retired: boolean }>();
    if (retired) return json({ error: "この旧端末設定は新方式へ移行済みです" }, 401);
    canonicalDevice = { ...identity.canonical, name: requestedName || displayNameForDevice(identity.canonical) };
  }
  const exp = Date.now() + 15 * 60_000;
  const ticket = await createTicket({ id: canonicalDevice.id, name: canonicalDevice.name, exp }, env.SESSION_SECRET);
  let iceServers: IceServer[];
  try { iceServers = await createIceServers(env); } catch (error) {
    console.error(JSON.stringify({ event: "turn_configuration_error", error: String(error) }));
    return json({ error: "TURN設定エラー" }, 503);
  }
  return json({ ticket, expiresAt: exp, serverNow: Date.now(), device: { id: canonicalDevice.id, name: canonicalDevice.name }, iceServers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ ok: true });
    if (url.pathname === "/api/register" && request.method === "POST") {
      const body: {
        installationId?: string; preferredName?: string; legacyDeviceId?: string; legacyCredential?: string;
        registeredDeviceId?: string; registeredCredential?: string;
      } = await request.json<{
        installationId?: string; preferredName?: string; legacyDeviceId?: string; legacyCredential?: string;
        registeredDeviceId?: string; registeredCredential?: string;
      }>().catch(() => ({}));
      let verifiedLegacyId: string | undefined;
      let verifiedRegisteredId: string | undefined;
      let recoveryLegacyId: string | undefined;
      if (body.legacyDeviceId || body.legacyCredential) {
        let devices;
        try { devices = parseDevices(env.DEVICE_TOKENS); }
        catch (error) { console.error(JSON.stringify({ event: "invalid_device_config", error: String(error) })); return json({ error: "サーバー設定エラー" }, 500); }
        const identity = body.legacyDeviceId ? resolveDeviceIdentity(body.legacyDeviceId, devices) : null;
        if (!identity || !body.legacyCredential || !(await tokensEqual(body.legacyCredential, identity.configured.token))) {
          return json({ error: "旧端末設定を確認できません" }, 401);
        }
        verifiedLegacyId = identity.canonical.id;
      }
      if (body.registeredDeviceId || body.registeredCredential) {
        if (!body.registeredDeviceId || !body.registeredCredential) return json({ error: "登録済み端末を確認できません" }, 401);
        const authenticated = await env.ROOMS.getByName("step-main").fetch("https://registry.internal/authenticate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ deviceId: body.registeredDeviceId, credential: body.registeredCredential })
        });
        if (!authenticated.ok) return json({ error: "登録済み端末を確認できません" }, 401);
        verifiedRegisteredId = (await authenticated.json<{ device: { id: string } }>()).device.id;
        const legacyName = /^(神領|大手町)(\d{1,2})$/.exec(String(body.preferredName || "").trim());
        if (legacyName) {
          let devices;
          try { devices = parseDevices(env.DEVICE_TOKENS); }
          catch (error) { console.error(JSON.stringify({ event: "invalid_device_config", error: String(error) })); return json({ error: "サーバー設定エラー" }, 500); }
          const candidate = `${legacyName[1] === "神領" ? "jinryo" : "otemachi"}-${legacyName[2]}`;
          recoveryLegacyId = resolveDeviceIdentity(candidate, devices)?.canonical.id;
        }
      }
      return env.ROOMS.getByName("step-main").fetch("https://registry.internal/register", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          installationId: body.installationId,
          preferredName: body.preferredName,
          verifiedLegacyId,
          verifiedRegisteredId,
          recoveryLegacyId,
          ip: request.headers.get("cf-connecting-ip") || "unknown"
        })
      });
    }
    if (url.pathname === "/api/session" && request.method === "POST") return sessionResponse(request, env);
    if (url.pathname === "/api/ws") {
      const ticket = url.searchParams.get("ticket") ?? "";
      const session = await verifyTicket(ticket, env.SESSION_SECRET);
      if (!session) return new Response("Unauthorized", { status: 401 });
      const headers = new Headers(request.headers);
      const mode = url.searchParams.get("mode") === "standby" ? "standby" : "active";
      headers.set("x-device-id", session.id); headers.set("x-device-name", encodeURIComponent(session.name)); headers.set("x-device-mode", mode);
      headers.set("x-device-urgent-target", mode === "active" ? (url.searchParams.get("urgentTarget") || "") : "");
      headers.set("x-device-wake-mode", url.searchParams.get("wake") === "targeted" ? "targeted" : "automatic");
      return env.ROOMS.getByName("step-main").fetch(new Request(request, { headers }));
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
