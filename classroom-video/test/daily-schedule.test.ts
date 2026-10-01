import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
function client() {
  const stored = new Map<string,string>();
  let tick = 0, timer: any = null;
  const context = vm.createContext({
    document: { getElementById: () => ({}), documentElement: { removeAttribute() {} } },
    window: { addEventListener() {} }, performance: { now: () => tick },
    localStorage: { getItem: (k:string) => stored.get(k) || null, setItem: (k:string,v:string) => stored.set(k,v) },
    clearTimeout() {}, setTimeout: (fn:any,ms:number) => { timer = { fn, ms }; return 1; },
  });
  vm.runInContext(app.replace("  init();", "  globalThis.api={state,operationDeadline,validTime,saveConfig,deviceConfig,beginOperation,scheduleOperationEnd};"), context);
  return { api:context.api, stored, timer: () => timer, advance: (ms:number) => { tick += ms; } };
}
const jst = (time:string,day="2026-10-01") => Date.parse(`${day}T${time}:00+09:00`);

describe("daily operating window", () => {
  it.each(["12:30","13:00","18:00","21:59"])("stops at 22:00 after waking at %s", time => {
    expect(client().api.operationDeadline(jst(time))).toBe(jst("22:00"));
  });
  it.each(["22:00","22:30","23:59","00:10","12:29"])("connects for one hour outside the window at %s", time => {
    const now=jst(time); expect(client().api.operationDeadline(now)).toBe(now+3600000);
  });
  it("uses changed start and end times", () => {
    const c=client(), config={scheduleStart:"10:00",scheduleEnd:"20:15"};
    expect(c.api.operationDeadline(jst("10:00"),config)).toBe(jst("20:15"));
    expect(c.api.operationDeadline(jst("20:15"),config)).toBe(jst("21:15"));
  });
  it("handles a window that crosses midnight", () => {
    const c=client(), config={scheduleStart:"20:00",scheduleEnd:"02:00"};
    expect(c.api.operationDeadline(jst("23:00"),config)).toBe(jst("02:00","2026-10-02"));
    expect(c.api.operationDeadline(jst("01:00"),config)).toBe(jst("02:00"));
    expect(c.api.operationDeadline(jst("02:00"),config)).toBe(jst("03:00"));
  });
  it("accepts valid times and rejects malformed times", () => {
    const c=client();
    expect(c.api.validTime("09:15","12:30")).toBe("09:15");
    for(const value of ["24:00","12:60","9:00","",null]) expect(c.api.validTime(value,"12:30")).toBe("12:30");
  });
  it("migrates the old hours setting without losing registration", () => {
    const c=client();c.stored.set("step-video-device",JSON.stringify({deviceId:"device-a",token:"credential",registrationVersion:2,tabletName:"大手1",durationHours:6}));
    const config=c.api.deviceConfig();
    expect(config.scheduleStart).toBe("12:30");expect(config.scheduleEnd).toBe("22:00");
    expect(config.durationHours).toBeUndefined();expect(config.token).toBe("credential");
  });
  it("keeps the original deadline across reconnects and ignores next-session setting changes", () => {
    const c=client();c.api.state.session={serverNow:jst("13:00")};c.api.beginOperation(true);
    c.api.saveConfig({deviceId:"device-a",token:"credential",scheduleStart:"10:00",scheduleEnd:"19:00"});
    c.advance(2*3600000);c.api.state.session.serverNow=jst("15:00");c.api.beginOperation(false);
    expect(JSON.parse(c.stored.get("step-video-operation")!).endsAt).toBe(jst("22:00"));
    expect(c.timer().ms).toBe(7*3600000);
    c.api.beginOperation(true);expect(JSON.parse(c.stored.get("step-video-operation")!).endsAt).toBe(jst("19:00"));
  });
  it("replaces a legacy six-hour operation with the daily deadline", () => {
    const c=client();c.stored.set("step-video-operation",JSON.stringify({startedAt:jst("13:00"),endsAt:jst("19:00"),durationHours:6,resting:false}));
    c.api.state.session={serverNow:jst("13:00")};c.api.beginOperation(false);
    expect(JSON.parse(c.stored.get("step-video-operation")!).endsAt).toBe(jst("22:00"));
  });
});
