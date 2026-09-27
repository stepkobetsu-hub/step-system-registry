import { DurableObject } from "cloudflare:workers";
import { campusOfDevice, createTicket, displayNameForDevice, parseDevices, resolveDeviceIdentity, tokensEqual, verifyTicket } from "./auth";

type Attachment = { id: string; name: string; mode: "active" | "standby"; connectedAt: number };
type SignalMessage = { type: "signal"; to: string; description?: unknown; candidate?: unknown; restart?: boolean };
type ClientMessage = SignalMessage | { type: "call"; callId: string; to: string } | { type: "ack"; callId: string } |
  { type: "media-state"; audio: boolean; video: boolean } | { type: "ping" };
type IceServer = { urls: string | string[]; username?: string; credential?: string };

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
    });
  }

  fetch(request: Request): Response {
    if (request.headers.get("upgrade") !== "websocket") return new Response("WebSocket required", { status: 426 });
    const id = request.headers.get("x-device-id");
    const encodedName = request.headers.get("x-device-name");
    const mode = request.headers.get("x-device-mode") === "standby" ? "standby" : "active";
    let name = "";
    try { name = decodeURIComponent(encodedName ?? ""); } catch { return new Response("Unauthorized", { status: 401 }); }
    if (!id || !name) return new Response("Unauthorized", { status: 401 });

    for (const current of this.ctx.getWebSockets(`device:${id}`)) this.closeSocket(current, 4001, "Replaced by a new connection");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [`device:${id}`]);
    server.serializeAttachment({ id, name, mode, connectedAt: Date.now() } satisfies Attachment);
    this.safeSend(server, { type: "welcome", self: { id, name }, mode, peers: this.peers(id) });
    if (mode === "active") this.broadcast({ type: "wake", from: { id, name } }, id, "standby");
    this.broadcast({ type: "presence", peers: this.peers() }, id);
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): void {
    const sender = socketAttachment(socket);
    if (!sender || typeof raw !== "string" || raw.length > 32_768) return;
    let message: ClientMessage;
    try { message = JSON.parse(raw) as ClientMessage; } catch { return; }
    if (message.type === "ping") { this.safeSend(socket, { type: "pong", at: Date.now() }); return; }
    if (sender.mode !== "active") return;
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
      this.ctx.storage.sql.exec("UPDATE calls SET acknowledged_by = ?, acknowledged_at = ? WHERE id = ?", sender.id, Date.now(), message.callId);
      this.sendTo(call.sender, { type: "ack", callId: message.callId, by: sender });
      const acknowledgingCampus = campusOfDevice(sender.id);
      if (acknowledgingCampus) this.broadcastToCampus(acknowledgingCampus, { type: "call-acknowledged", callId: message.callId });
    }
  }

  webSocketClose(socket: WebSocket): void { const id = socketAttachment(socket)?.id; this.broadcast({ type: "presence", peers: this.peers() }, id); }
  webSocketError(socket: WebSocket): void { const id = socketAttachment(socket)?.id; this.closeSocket(socket, 1011, "Socket error"); this.broadcast({ type: "presence", peers: this.peers() }, id); }

  private peers(exclude?: string): Attachment[] {
    const peers = new Map<string, Attachment>();
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      const peer = socketAttachment(socket);
      if (!peer || peer.mode !== "active" || peer.id === exclude) continue;
      const previous = peers.get(peer.id);
      if (!previous || previous.connectedAt < peer.connectedAt) peers.set(peer.id, peer);
    }
    return [...peers.values()].map(({ id, name, mode, connectedAt }) => ({ id, name, mode, connectedAt }));
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
  let devices;
  try { devices = parseDevices(env.DEVICE_TOKENS); } catch (error) { console.error(JSON.stringify({ event: "invalid_device_config", error: String(error) })); return json({ error: "サーバー設定エラー" }, 500); }
  const identity = resolveDeviceIdentity(body.deviceId, devices);
  if (!identity || !(await tokensEqual(token, identity.configured.token))) return json({ error: "端末を確認できません" }, 401);
  const requestedName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (requestedName.length > 24) return json({ error: "端末名は24文字以内にしてください" }, 400);
  const canonicalDevice = { ...identity.canonical, name: requestedName || displayNameForDevice(identity.canonical) };
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
    if (url.pathname === "/api/session" && request.method === "POST") return sessionResponse(request, env);
    if (url.pathname === "/api/ws") {
      const ticket = url.searchParams.get("ticket") ?? "";
      const session = await verifyTicket(ticket, env.SESSION_SECRET);
      if (!session) return new Response("Unauthorized", { status: 401 });
      const headers = new Headers(request.headers);
      const mode = url.searchParams.get("mode") === "standby" ? "standby" : "active";
      headers.set("x-device-id", session.id); headers.set("x-device-name", encodeURIComponent(session.name)); headers.set("x-device-mode", mode);
      return env.ROOMS.getByName("step-main").fetch(new Request(request, { headers }));
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
