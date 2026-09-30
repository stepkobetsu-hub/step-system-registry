import { readFileSync } from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

function client() {
  let now = 0, sequence = 0;
  const timers = new Map<number, { callback: () => void; at: number }>();
  const listeners = new Map<string, (() => void)[]>();
  const elements = new Map<string, any>();
  const element = (id: string) => {
    if (!elements.has(id)) {
      const classes = new Set<string>();
      const attributes = new Map<string, string>();
      const children = new Map<string, any>();
      elements.set(id, {
        textContent: "", disabled: false, children: [], style: {}, dataset: {},
        classList: { add: (x: string) => classes.add(x), remove: (x: string) => classes.delete(x), contains: (x: string) => classes.has(x), toggle: (x: string, on: boolean) => on ? classes.add(x) : classes.delete(x) },
        setAttribute: (k: string, v: string) => attributes.set(k, v),
        getAttribute: (k: string) => attributes.get(k), removeAttribute: (k: string) => attributes.delete(k),
        querySelector: (selector: string) => { if (!children.has(selector)) children.set(selector, element(id + selector)); return children.get(selector); },
      });
    }
    return elements.get(id);
  };
  const brightness: number[] = [], sent: any[] = [];
  const addListener = (type: string, callback: () => void) => listeners.set(type, [...listeners.get(type) || [], callback]);
  const document = { getElementById: element, visibilityState: "visible", documentElement: element("html"), addEventListener: addListener };
  const context = vm.createContext({ document, window: { addEventListener: addListener, StepNative: { setScreenBrightnessLevel: (level: number) => brightness.push(level) } },
    performance: { now: () => now }, localStorage: { getItem: () => null }, WebSocket: { OPEN: 1 },
    setTimeout: (callback: () => void, delay: number) => { const id = ++sequence; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  vm.runInContext(app.replace("  init();", "  globalThis.testApi={state,applyMediaState,connectSocket,setRemoteMic,receiveRemoteMic,updateRemoteMicControls,bindIdleBrightness,resetIdleBrightness,updateIdleBrightness,incomingCall,videoProfile};"), context);
  const api = context.testApi;
  api.state.ws = { readyState: 1, send: (value: string) => sent.push(JSON.parse(value)) };
  api.state.session = { device: { id: "a" } };
  return { api, element, brightness, sent, context, document, timers,
    emit: (type: string) => listeners.get(type)?.forEach(fn => fn()),
    advance: (ms: number) => { const end = now + ms; while (true) { const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; timers.delete(next[0]); now = next[1].at; next[1].callback(); } now = end; },
  };
}

describe("Issue 79 client behavior", () => {
  it("starts each page with microphone off and synchronizes UI before media opens", () => {
    const c = client(); c.api.applyMediaState();
    expect(c.api.state.media.audio).toBe(false);
    expect(c.element("mic").getAttribute("aria-pressed")).toBe("false");
    expect(c.element("mic").querySelector("b").textContent).toBe("マイク OFF");
    expect(c.element("local-mic-off").classList.contains("hidden")).toBe(false);
    expect(c.sent.at(-1)).toEqual({ type: "media-state", audio: false, video: true });
    c.api.state.media.audio = true;
    expect(client().api.state.media.audio).toBe(false);
  });
  it("applies remote ON/OFF to audio only and announces the authenticated sender", () => {
    const c = client(), audio = { enabled: false }, video = { enabled: true };
    c.api.state.local = { getAudioTracks: () => [audio], getVideoTracks: () => [video] };
    for (const enabled of [true, false]) {
      c.api.receiveRemoteMic({ from: "b", fromName: "神領1", enabled });
      expect(audio.enabled).toBe(enabled); expect(video.enabled).toBe(true);
      expect(c.sent.at(-1)).toEqual({ type: "media-state", audio: enabled, video: true });
      expect(c.element("local-mic-off").classList.contains("hidden")).toBe(enabled);
      expect(c.element("notice").textContent).toBe(`神領1がマイクを${enabled ? "ON" : "OFF"}にしました`);
    }
  });
  it("rejects malformed remote commands and commands after stopping", () => {
    const c = client();
    for (const message of [{ from: "a", fromName: "self", enabled: true }, { from: "b", fromName: "B", enabled: "true" }, { from: "b", enabled: true }]) c.api.receiveRemoteMic(message);
    c.api.state.manualStop = true; c.api.receiveRemoteMic({ from: "b", fromName: "B", enabled: true });
    expect(c.api.state.media.audio).toBe(false); expect(c.sent).toHaveLength(0);
  });
  it("targets only the featured connected peer and disables controls after disconnect", () => {
    const c = client();
    for (const id of ["b", "c"]) { c.api.state.presence.set(id, { id, name: id }); c.api.state.peers.set(id, { pc: { iceConnectionState: "connected" } }); }
    c.api.state.featuredPeerId = "b"; c.api.setRemoteMic(false);
    c.api.state.featuredPeerId = "c"; c.api.setRemoteMic(true);
    expect(c.sent).toEqual([{ type: "remote-mic", to: "b", enabled: false }, { type: "remote-mic", to: "c", enabled: true }]);
    c.api.state.peers.get("c").pc.iceConnectionState = "disconnected";
    c.api.setRemoteMic(true); expect(c.sent).toHaveLength(2);
    expect(c.element("remote-mic-on").disabled).toBe(true);
  });
  it("dims at exactly one, two, and three hours and stops scheduling at the last step", () => {
    const c = client(); c.api.bindIdleBrightness(); c.advance(3599999); expect(c.brightness).toEqual([0]);
    c.advance(1); expect(c.brightness).toEqual([0, 1]);
    c.advance(3600000); c.advance(3600000); expect(c.brightness).toEqual([0, 1, 2, 3]); expect(c.timers.size).toBe(0);
  });
  it.each(["pointerdown", "touchstart", "click", "keydown", "input", "change"])("restores brightness immediately on %s and restarts the deadline", event => {
    const c = client(); c.api.bindIdleBrightness(); c.advance(7200000); c.emit(event);
    expect(c.brightness.at(-1)).toBe(0); expect(c.timers.size).toBe(1);
    c.advance(3599999); expect(c.brightness.at(-1)).toBe(0); c.advance(1); expect(c.brightness.at(-1)).toBe(1);
  });
  it("does not reset idle time on a remote mic message", () => {
    const c = client(); c.api.bindIdleBrightness(); c.advance(3599999);
    c.api.receiveRemoteMic({ from: "b", fromName: "B", enabled: true }); c.advance(1); expect(c.brightness.at(-1)).toBe(1);
  });
  it("restores brightness on incoming call", () => {
    const c = client(); c.api.bindIdleBrightness(); c.advance(10800000);
    c.api.incomingCall({ callId: "call", from: { name: "B" } }); expect(c.brightness.at(-1)).toBe(0);
  });
  it("suspends timers in background, resumes elapsed idle time, and clears on pagehide", () => {
    const c = client(); c.api.bindIdleBrightness(); c.advance(3600000);
    c.document.visibilityState = "hidden"; c.emit("visibilitychange"); expect(c.timers.size).toBe(0); expect(c.brightness.at(-1)).toBe(0);
    c.advance(3600000); c.document.visibilityState = "visible"; c.emit("visibilitychange"); expect(c.brightness.at(-1)).toBe(2);
    c.emit("pagehide"); expect(c.timers.size).toBe(0); expect(c.brightness.at(-1)).toBe(0);
  });
});

function room() {
  const source = transformSync(worker, { loader: "ts", format: "cjs", target: "es2022" }).code;
  const context = vm.createContext({ module: { exports: {} }, require: () => ({ DurableObject: class { ctx: any; constructor(ctx: any) { this.ctx = ctx; } } }), WebSocket: { OPEN: 1 }, Date });
  vm.runInContext(source, context);
  const sockets: any[] = [];
  const ctx = { blockConcurrencyWhile: () => {}, getWebSockets: (tag?: string) => sockets.filter(s => !tag || tag === `device:${s.attachment?.id}`) };
  const instance = new context.module.exports.VideoRoom(ctx, {});
  const socket = (id: string, mode = "active") => { const s = { readyState: 1, attachment: { id, name: id.toUpperCase(), mode, lastSeenAt: Date.now() }, sent: [] as any[], deserializeAttachment() { return this.attachment; }, send(value: string) { this.sent.push(JSON.parse(value)); } }; sockets.push(s); return s; };
  return { instance, socket, sockets, send: (s: any, message: any) => instance.webSocketMessage(s, JSON.stringify(message)) };
}

describe("Issue 79 room authorization", () => {
  it("routes to one device and overwrites forged sender fields from the socket", () => {
    const r = room(), a = r.socket("a"), b = r.socket("b"), c = r.socket("c");
    r.send(a, { type: "remote-mic", to: "b", enabled: true, from: "c", fromName: "fake" });
    expect(b.sent).toEqual([{ type: "remote-mic", enabled: true, from: "a", fromName: "A" }]);
    expect(a.sent).toHaveLength(0); expect(c.sent).toHaveLength(0);
  });
  it.each(["standby", "closed", "stale", "outside-room", "unauthenticated"])("rejects %s sender", condition => {
    const r = room(), a = r.socket("a"), b = r.socket("b");
    if (condition === "standby") a.attachment.mode = "standby";
    if (condition === "closed") a.readyState = 3;
    if (condition === "stale") a.attachment.lastSeenAt -= 71000;
    if (condition === "outside-room") r.sockets.splice(0, 1);
    if (condition === "unauthenticated") (a as any).attachment = null;
    r.send(a, { type: "remote-mic", to: "b", enabled: true }); expect(b.sent).toHaveLength(0);
  });
  it.each(["standby", "closed", "stale", "missing", "self", "invalid-enabled"])("rejects %s target or payload", condition => {
    const r = room(), a = r.socket("a"), b = r.socket("b");
    if (condition === "standby") b.attachment.mode = "standby";
    if (condition === "closed") b.readyState = 3;
    if (condition === "stale") b.attachment.lastSeenAt -= 71000;
    r.send(a, { type: "remote-mic", to: condition === "missing" ? "z" : condition === "self" ? "a" : "b", enabled: condition === "invalid-enabled" ? "true" : true });
    expect(a.sent).toHaveLength(0); expect(b.sent).toHaveLength(0);
  });
  it("ignores null and invalid JSON without throwing", () => {
    const r = room(), a = r.socket("a");
    expect(() => r.send(a, null)).not.toThrow();
    expect(() => r.instance.webSocketMessage(a, "{")).not.toThrow();
  });
});
