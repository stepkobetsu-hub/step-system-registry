const encoder = new TextEncoder();

export type Device = { id: string; name: string };
export type Session = Device & { exp: number };

export function campusOfDevice(deviceId: string): "jinryo" | "otemachi" | null {
  if (deviceId.startsWith("jinryo-")) return "jinryo";
  if (deviceId.startsWith("otemachi-")) return "otemachi";
  return null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function parseDevices(source: string): Map<string, Device & { token: string }> {
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed)) throw new Error("DEVICE_TOKENS must be a JSON array");
  const devices = new Map<string, Device & { token: string }>();
  for (const item of parsed) {
    if (!item || typeof item !== "object") throw new Error("Invalid device entry");
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || !/^[a-z0-9-]{2,32}$/.test(candidate.id) ||
        typeof candidate.name !== "string" || candidate.name.length > 40 ||
        typeof candidate.token !== "string" || candidate.token.length < 24) throw new Error("Invalid device entry");
    devices.set(candidate.id, { id: candidate.id, name: candidate.name, token: candidate.token });
  }
  return devices;
}

export function resolveDeviceIdentity(requestedId: string, devices: Map<string, Device & { token: string }>) {
  const migrated = requestedId === "shinryo" ? "jinryo" : requestedId;
  const match = /^(jinryo|otemachi)(?:-([a-z0-9][a-z0-9-]{0,22}))?$/.exec(migrated);
  if (!match) return null;
  const campusId = match[1];
  const slot = match[2] ?? "1";
  const lookupCandidates = campusId === "jinryo" ? [migrated, "jinryo", "shinryo"] : [migrated, "otemachi"];
  const configured = lookupCandidates.map((id) => devices.get(id)).find(Boolean);
  if (!configured) return null;
  return { configured, canonical: { ...configured, id: `${campusId}-${slot}` } };
}

export function displayNameForDevice(device: Device): string {
  const slot = /-(\d+)$/.exec(device.id)?.[1];
  const campus = device.id.startsWith("jinryo") ? "神領" : device.id.startsWith("otemachi") ? "大手町" : device.name;
  return slot ? `${campus}${slot}` : device.name || campus;
}

export async function tokensEqual(left: string, right: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", encoder.encode("step-token-compare"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const [a, b] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(left)),
    crypto.subtle.sign("HMAC", key, encoder.encode(right))
  ]);
  const av = new Uint8Array(a); const bv = new Uint8Array(b);
  let different = av.length ^ bv.length;
  for (let index = 0; index < av.length; index += 1) different |= av[index] ^ (bv[index] ?? 0);
  return different === 0;
}

export async function createTicket(session: Session, secret: string): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${bytesToBase64Url(await hmac(secret, payload))}`;
}

export async function verifyTicket(ticket: string, secret: string, now = Date.now()): Promise<Session | null> {
  const [payload, signature, extra] = ticket.split(".");
  if (!payload || !signature || extra) return null;
  const expected = bytesToBase64Url(await hmac(secret, payload));
  if (!(await tokensEqual(signature, expected))) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as Session;
    if (!session || typeof session.id !== "string" || typeof session.name !== "string" || typeof session.exp !== "number" || session.exp < now) return null;
    return session;
  } catch {
    return null;
  }
}
