import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

function room() {
  const sockets: any[] = [], known = [{id:"a",name:"A"},{id:"b",name:"B"},{id:"off",name:"Offline"}];
  const sql: string[] = [];
  const ctx = {
    blockConcurrencyWhile: () => {}, waitUntil: () => {},
    getWebSockets: (tag?: string) => sockets.filter(s => !tag || tag === `device:${s.info?.id}`),
    acceptWebSocket: (s: any) => sockets.push(s),
    storage: { getAlarm: async () => 1, sql: { exec: (query: string) => { sql.push(query); return {toArray: () => query.startsWith("SELECT id, name FROM room_device_names") ? known : []}; } }, setAlarm: async () => {} },
  };
  class Socket {
    readyState = 1; info: any; sent: any[] = [];
    deserializeAttachment() { return this.info; }
    serializeAttachment(info: any) { this.info = info; }
    send(raw: string) { this.sent.push(JSON.parse(raw)); }
    close() { this.readyState = 3; }
  }
  const context = vm.createContext({ module: {exports:{}}, require: () => ({DurableObject:class {ctx: any; constructor(c: any){this.ctx=c;}}}),
    WebSocket:{OPEN:1,CLOSING:2,CLOSED:3}, Date, URL, console,
    WebSocketPair: class { 0=new Socket(); 1=new Socket(); },
    Response:class {status: number; constructor(_body: any, init: any){this.status=init.status;}},
  });
  vm.runInContext(transformSync(worker,{loader:"ts",format:"cjs",target:"es2022"}).code,context);
  const instance = new context.module.exports.VideoRoom(ctx,{});
  const socket = (id: string, mode="active") => {const s=new Socket();s.info={id,name:id.toUpperCase(),mode,lastSeenAt:Date.now(),connectedAt:Date.now()};sockets.push(s);return s;};
  return {instance,socket,sockets,sql,known,send:(s: any,message: any)=>instance.webSocketMessage(s,JSON.stringify(message))};
}

describe("Issue 80 room routing",()=>{
  it("lists standby separately from active presence and shows disconnected known devices without secrets",()=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby"),stale=r.socket("old","standby");
    stale.info.lastSeenAt-=71000; r.known.push({id:"old",name:"Old"});
    b.info.credential="must-not-leak";
    r.send(a,{type:"list-devices"});
    expect(a.sent[0]).toEqual({type:"device-list",devices:[{id:"b",name:"B",status:"standby"},{id:"off",name:"Offline",status:"offline"},{id:"old",name:"Old",status:"offline"}]});
    expect(JSON.stringify(a.sent)).not.toContain("credential");
    expect(r.instance.peers("a")).toEqual([]);
  });
  it("wakes only the selected standby socket with trusted sender identity",()=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby"),c=r.socket("c","standby");
    r.send(a,{type:"wake-device",to:"b",from:{id:"fake",name:"Fake"}});
    expect(b.sent).toEqual([{type:"wake",from:{id:"a",name:"A"},manual:true}]);
    expect(c.sent).toEqual([]); expect(a.sent.at(-1)).toEqual({type:"wake-result",to:"b",status:"requested"});
    r.send(a,{type:"wake-device",to:"b"}); expect(b.sent).toHaveLength(1);
  });
  it.each(["standby","closed","stale","unregistered","unauthenticated"])("rejects %s sender for both directory and wake",mode=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby");
    if(mode==="standby")a.info.mode="standby";
    if(mode==="closed")a.close();
    if(mode==="stale")a.info.lastSeenAt-=71000;
    if(mode==="unregistered")r.sockets.splice(0,1);
    if(mode==="unauthenticated")a.info=null;
    r.send(a,{type:"list-devices"});r.send(a,{type:"wake-device",to:"b"});expect(b.sent).toEqual([]);expect(a.sent).toEqual([]);
  });
  it.each(["active","closed","stale","missing","self","malformed"])("reports unavailable for %s target",mode=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby");
    if(mode==="active")b.info.mode="active";
    if(mode==="closed")b.close();
    if(mode==="stale")b.info.lastSeenAt-=71000;
    r.send(a,{type:"wake-device",to:mode==="missing"?"off":mode==="self"?"a":mode==="malformed"?{}:"b"});
    expect(b.sent).toEqual([]);expect(a.sent.at(-1)?.status).toBe("unavailable");
  });
  it("does not cascade when the recovered tablet joins active, including after other active devices leave",async()=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby"),c=r.socket("c","standby");
    r.send(a,{type:"wake-device",to:"b"}); b.close(); a.close();
    await r.instance.fetch(new Request("https://internal/ws",{headers:{upgrade:"websocket","x-device-id":"b","x-device-name":"B","x-device-wake-mode":"targeted"}}));
    expect(c.sent.filter(m=>m.type==="wake")).toEqual([]);
    expect(r.instance.peers().map((p: any)=>p.id)).toEqual(["b"]);
  });
  it("preserves normal automatic waking on an ordinary active join",async()=>{
    const r=room(),b=r.socket("b","standby");
    await r.instance.fetch(new Request("https://internal/ws",{headers:{upgrade:"websocket","x-device-id":"a","x-device-name":"A"}}));
    expect(b.sent).toContainEqual({type:"wake",from:{id:"a",name:"A"}});
  });
  it("reports unavailable if the standby socket fails during delivery",()=>{
    const r=room(),a=r.socket("a"),b=r.socket("b","standby");
    b.send=()=>{throw new Error("closed during send")};
    r.send(a,{type:"wake-device",to:"b"});
    expect(a.sent.at(-1)).toEqual({type:"wake-result",to:"b",status:"unavailable"});
  });
});

function client() {
  const elements=new Map<string,any>(), timers=new Map<number,{fn:()=>void,delay:number}>();let seq=0,sessionCount=0;
  const el=(id: string): any=>{if(!elements.has(id)){const classes=new Set(["hidden"]);let text="";const e:any={children:[],style:{},dataset:{},classList:{add:(c:string)=>classes.add(c),remove:(c:string)=>classes.delete(c),contains:(c:string)=>classes.has(c),toggle:(c:string,on:boolean)=>on?classes.add(c):classes.delete(c)},setAttribute(){},removeAttribute(){},append(...nodes:any[]){this.children.push(...nodes)},querySelector:(s:string)=>el(id+s)};Object.defineProperty(e,"textContent",{get:()=>text,set:v=>{text=v;e.children=[]}});elements.set(id,e);}return elements.get(id);};
  const stored=new Map<string,string>([["step-video-device",JSON.stringify({deviceId:"b",token:"test",tabletName:"B",registrationVersion:2,durationHours:6,controlsTimeout:5,qualityMode:"smooth",showSelf:true})],["step-video-operation",JSON.stringify({resting:true})]]);
  const sockets:any[]=[];
  class Socket {static OPEN=1;readyState=0;sent:any[]=[];onopen?:()=>void;onmessage?:(e:any)=>void;onclose?:()=>void;url:string;constructor(url:string){this.url=url;sockets.push(this)}send(raw:string){this.sent.push(JSON.parse(raw))}close(){this.readyState=3;this.onclose?.()}open(){this.readyState=1;this.onopen?.()}message(data:any){this.onmessage?.({data:JSON.stringify(data)})}}
  const context=vm.createContext({document:{getElementById:el,createElement:()=>el("new"+(++seq)),createTextNode:(text:string)=>text,documentElement:el("html"),visibilityState:"visible",addEventListener(){}},window:{addEventListener(){}},navigator:{onLine:true,mediaDevices:{getUserMedia:async()=>({getTracks:()=>[],getAudioTracks:()=>[],getVideoTracks:()=>[]})}},location:{protocol:"https:",host:"local.test"},performance:{now:()=>0},crypto:webcrypto,console,WebSocket:Socket,
    localStorage:{getItem:(k:string)=>stored.get(k)||null,setItem:(k:string,v:string)=>stored.set(k,v),removeItem:(k:string)=>stored.delete(k)},
    fetch:async()=>({ok:true,json:async()=>({device:{id:"b",name:"B"},ticket:"fresh-"+(++sessionCount),serverNow:Date.now(),expiresAt:Date.now()+900000,iceServers:[]})}),
    setTimeout:(fn:()=>void,delay:number)=>{const id=++seq;timers.set(id,{fn,delay});return id;},clearTimeout:(id:number)=>timers.delete(id),setInterval:(fn:()=>void,delay:number)=>{const id=++seq;timers.set(id,{fn,delay});return id;},clearInterval:(id:number)=>timers.delete(id),requestAnimationFrame:()=>1,
  });
  vm.runInContext(app.replace("  init();","  globalThis.api={state,startStandby,receiveDeviceList,wakeDevice,openWakePicker,finishWake,handlePeerState,connectSocket,invalidateDeviceDirectory};"),context);
  const api=context.api;
  return {api,el,sockets,stored,timers,context,sessionCount:()=>sessionCount,tick:async()=>{for(let i=0;i<30;i++)await Promise.resolve()},expire:(delay:number)=>{for(const [id,t] of [...timers])if(t.delay===delay){timers.delete(id);t.fn();}}};
}

describe("Issue 80 standby recovery",()=>{
  it("keeps a resting device asleep on welcome, then uses a fresh ticket and starts watchdog after targeted wake",async()=>{
    const c=client();await c.api.startStandby();const standby=c.sockets[0];standby.open();
    standby.message({type:"welcome",peers:[{id:"a",name:"A"}]});await c.tick();expect(c.sockets).toHaveLength(1);
    standby.message({type:"wake",manual:true,from:{id:"a",name:"A"}});await c.tick();
    expect(standby.readyState).toBe(3);expect(c.sessionCount()).toBe(2);
    expect(c.sockets[1].url).toContain("mode=active&wake=targeted&ticket=fresh-2");
    expect(JSON.parse(c.stored.get("step-video-operation")!).resting).toBe(false);
    expect(JSON.parse(c.stored.get("step-video-operation")!).targetedWake).toBe(true);
    expect(c.api.state.media.audio).toBe(false);expect(c.api.state.watchdogTimer).not.toBeNull();
    standby.message({type:"wake",manual:true});await c.tick();expect(c.sessionCount()).toBe(2);
    c.api.connectSocket();expect(c.sockets[2].url).toContain("wake=targeted");
  });
  it("renders offline/active devices disabled and sends exactly one selected wake request",()=>{
    const c=client();const sent:any[]=[];c.api.state.session={device:{id:"a"}};c.api.state.ws={readyState:1,send:(s:string)=>sent.push(JSON.parse(s))};
    c.api.receiveDeviceList({devices:[{id:"b",name:"B",status:"standby"},{id:"c",name:"C",status:"standby"},{id:"off",name:"Off",status:"offline"},{id:"live",name:"Live",status:"active"}]});
    const buttons=c.el("wake-list").children;expect(buttons.filter((b:any)=>b.disabled)).toHaveLength(2);
    expect(buttons.some((b:any)=>b.textContent.includes("オフライン・復旧不可"))).toBe(true);
    c.api.wakeDevice("b");c.api.wakeDevice("c");expect(sent).toEqual([{type:"wake-device",to:"b"}]);
    c.expire(30000);expect(c.el("wake-status").textContent).toBe("Bは現在復旧できません");
  });
  it("reports success only when the selected peer actually connects",()=>{
    const c=client();c.api.state.ws={readyState:1,send(){}};
    c.api.receiveDeviceList({devices:[{id:"a",name:"A",status:"standby"}]});c.api.wakeDevice("a");
    c.api.receiveDeviceList({devices:[{id:"a",name:"A",status:"active"}]});expect(c.api.state.pendingWake).not.toBeNull();
    c.api.handlePeerState({info:{id:"a"},pc:{iceConnectionState:"connected"}});
    expect(c.api.state.pendingWake).toBeNull();expect(c.el("wake-status").textContent).toBe("Aが接続しました");
  });
  it("invalidates stale choices and pending recovery after sender disconnects",()=>{
    const c=client();c.api.state.ws={readyState:1,send(){}};c.api.receiveDeviceList({devices:[{id:"a",name:"A",status:"standby"}]});c.api.wakeDevice("a");
    c.api.state.ws=null;c.api.invalidateDeviceDirectory();expect(c.api.state.pendingWake).toBeNull();expect(c.el("wake-list").children[0].disabled).toBe(true);
  });
  it("returns to standby after camera failure without looping on the active peer welcome",async()=>{
    const c=client();await c.api.startStandby();const standby=c.sockets[0];standby.open();
    c.context.navigator.mediaDevices.getUserMedia=async()=>{throw new Error("camera unavailable")};
    standby.message({type:"wake",manual:true,from:{id:"a",name:"A"}});await c.tick();
    expect(c.api.state.manualStop).toBe(true);expect(c.sockets.at(-1).url).toContain("mode=standby");
    const requests=c.sessionCount();c.sockets.at(-1).message({type:"welcome",peers:[{id:"a",name:"A"}]});await c.tick();
    expect(c.sessionCount()).toBe(requests);
  });
});
