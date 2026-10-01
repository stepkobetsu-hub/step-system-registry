import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const tablets = [
  { id: "device-a", name: "大手1" },
  { id: "device-b", name: "大手サブ" },
  { id: "device-c", name: "神領1" },
  { id: "device-d", name: "神領サブ" },
];

function client(device: { id: string; name: string }) {
  const offers: string[] = [], closed: string[] = [], elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, { children: [], classList: { contains: () => true, toggle() {}, add() {}, remove() {} }, textContent: "", querySelector: () => null });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element }, window: { addEventListener() {} },
    performance: { now: () => 0 }, localStorage: { getItem: () => null },
    requestAnimationFrame: () => 1, WebSocket: { OPEN: 1 }, clearTimeout() {}, console,
  });
  vm.runInContext(app.replace("  init();", `
    callPeer=async (peer)=>{if(shouldConnectMedia(peer))offers.push(peer.id);};
    closePeer=(id)=>{closed.push(id);state.peers.delete(id);};
    configurePeerSenders=async()=>{};sendMediaState=()=>{};
    globalThis.api={state,campusForPeer,shouldConnectMedia,mediaPeerCount,onPresence,onSignal,outgoingTracks};
  `), Object.assign(context, { offers, closed }));
  const api = context.api;
  api.state.session = { device };
  return { api, offers, closed };
}

describe("two campuses with main and sub tablets", () => {
  it("connects exactly the four cross-campus pairs and no same-campus pair", () => {
    const pairs: string[] = [];
    for (const own of tablets) {
      const c = client(own), peers = tablets.filter(peer => peer.id !== own.id);
      c.api.onPresence(peers);
      expect(c.api.mediaPeerCount()).toBe(2);
      expect([...c.api.state.presence.keys()]).toHaveLength(3);
      for (const peer of peers) {
        if (c.api.shouldConnectMedia(peer)) pairs.push([own.id, peer.id].sort().join(":"));
      }
      expect(c.offers.every(id => c.api.campusForPeer(peers.find(peer => peer.id === id)) !== c.api.campusForPeer(own))).toBe(true);
    }
    expect(new Set(pairs).size).toBe(4);
    expect(pairs).toHaveLength(8);
  });

  it("keeps the two-stream bound across every joining order", () => {
    for (const own of tablets) {
      const others = tablets.filter(peer => peer.id !== own.id);
      for (const first of others) for (const second of others.filter(peer => peer !== first)) {
        const order = [first, second, ...others.filter(peer => peer !== first && peer !== second)];
        const c = client(own);
        for (let count = 1; count <= 3; count++) {
          c.api.onPresence(order.slice(0, count));
          expect(c.api.mediaPeerCount()).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("closes an existing same-campus stream while leaving opposite-campus media connected", () => {
    const c = client(tablets[0]);
    c.api.state.presence = new Map(tablets.slice(1).map(peer => [peer.id, peer]));
    for (const peer of tablets.slice(1)) c.api.state.peers.set(peer.id, { info: peer });
    c.api.onPresence(tablets.slice(1));
    expect(c.closed).toEqual(["device-b"]);
    expect([...c.api.state.peers.keys()]).toEqual(["device-c", "device-d"]);
  });

  it("removes a departing peer and reconnects it without adding the local sub tablet", () => {
    const c = client(tablets[0]);
    c.api.onPresence(tablets.slice(1));
    c.api.state.peers.set("device-d", { info: tablets[3] });
    c.api.onPresence(tablets.slice(1, 3));
    expect(c.closed).toContain("device-d");
    c.api.onPresence(tablets.slice(1));
    expect(c.offers).toContain("device-d");
    expect(c.offers).not.toContain("device-b");
  });

  it("ignores queued offers, candidates, and restart requests from same-campus or departed devices", async () => {
    const c = client(tablets[0]);
    c.api.onPresence(tablets.slice(1));
    c.offers.length = 0;
    for (const from of ["device-b", "departed"]) for (const payload of [
      { description: { type: "offer" } }, { candidate: { candidate: "ice" } }, { restart: true },
    ]) await c.api.onSignal({ from, ...payload });
    expect(c.offers).toHaveLength(0);
    expect(c.api.state.peers.size).toBe(0);
    expect(c.api.state.candidateQueues.size).toBe(0);
  });

  it("recognizes saved campus names after migration to random device IDs", () => {
    const c = client(tablets[0]);
    for (const name of ["大手１", "大手町2", "大手町サブ", " 大手サブ "]) expect(c.api.campusForPeer({ id: "device-random", name })).toBe("otemachi");
    for (const name of ["神領２", "神領サブ"]) expect(c.api.campusForPeer({ id: "device-random", name })).toBe("jinryo");
    expect(c.api.campusForPeer({ id: "jinryo-1", name: "大手サブ" })).toBe("otemachi");
    expect(c.api.campusForPeer({ id: "jinryo-1", name: "予備" })).toBe("jinryo");
  });

  it("preserves connectivity for unnamed devices and explicitly refuses self", () => {
    const c = client(tablets[0]);
    expect(c.api.shouldConnectMedia({ id: "device-new", name: "STEP端末5" })).toBe(true);
    expect(c.api.shouldConnectMedia(tablets[0])).toBe(false);
    expect(c.api.shouldConnectMedia(undefined)).toBe(false);
  });
});


describe("temporary urgent phone", () => {
  const phone={id:"phone",name:"管理者携帯",urgentTarget:"device-c"};
  it("connects only the selected receiver, preserving two video peers on every tablet",()=>{
    for(const own of tablets){const c=client(own);c.api.onPresence([...tablets.filter(p=>p.id!==own.id),phone]);expect(c.api.shouldConnectMedia(phone)).toBe(own.id===phone.urgentTarget);expect(c.api.mediaPeerCount()).toBe(2);}
    const c=client(phone);c.api.state.urgentTarget=phone.urgentTarget;
    for(const peer of tablets)expect(c.api.shouldConnectMedia(peer)).toBe(peer.id===phone.urgentTarget);
  });
  it("sends cloned audio only and keeps it muted until acknowledgement without changing normal tracks",()=>{
    const c=client(tablets[2]);const audio={kind:"audio",enabled:false,clone(){return {kind:this.kind,enabled:this.enabled};}},video={kind:"video",enabled:true};
    c.api.state.local={getTracks:()=>[audio,video],getAudioTracks:()=>[audio]};
    expect(c.api.outgoingTracks(tablets[0])).toEqual([audio,video]);
    const ringing=c.api.outgoingTracks(phone);expect(ringing).toHaveLength(1);expect(ringing[0].kind).toBe("audio");expect(ringing[0].enabled).toBe(false);
    c.api.state.urgentAccepted.add(phone.id);expect(c.api.outgoingTracks(phone)[0].enabled).toBe(true);expect(audio.enabled).toBe(false);expect(video.enabled).toBe(true);
    c.api.onPresence(tablets.filter(p=>p.id!==tablets[2].id));c.api.state.presence.set(phone.id,phone);c.api.onPresence(tablets.filter(p=>p.id!==tablets[2].id));expect(c.api.state.urgentAccepted.has(phone.id)).toBe(false);
  });
});
