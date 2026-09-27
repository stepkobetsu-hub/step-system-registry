import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const android = readFileSync(new URL("../android/app/src/main/java/jp/stepkobetsu/classroomvideo/MainActivity.java", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

describe("PR review regressions", () => {
  it("unlocks and reuses one AudioContext before connecting", () => {
    expect(app).toMatch(/function unlockAudio\(\)/);
    expect(app).toMatch(/async function start\([^)]*\)\{unlockAudio\(\)/);
    expect(app).toMatch(/const context=state\.audioContext/);
    expect(app).toMatch(/StepNative\.playChime\(\)/);
  });

  it("offers only 5 through 12 hours and defaults to 6", () => {
    const durationSelect = html.match(/<select id="duration-hours">([\s\S]*?)<\/select>/)?.[1] ?? "";
    const values = [...durationSelect.matchAll(/<option value="(\d+)"/g)].map((match) => Number(match[1]));
    expect(values).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(html).toContain('<option value="6" selected>');
  });

  it("persists rest state and releases call resources", () => {
    expect(app).toMatch(/resting:true/);
    expect(app).toMatch(/getTracks\(\)\.forEach\(\(track\)=>track\.stop\(\)\)/);
    expect(app).toMatch(/state\.ws\?\.close\(\)/);
    expect(app).toMatch(/state\.wakeLock\?\.release\(\)/);
    expect(worker).toMatch(/serverNow: Date\.now\(\)/);
  });

  it("limits WebView navigation and permissions to the configured origin", () => {
    expect(android).toMatch(/shouldOverrideUrlLoading/);
    expect(android).toMatch(/!isAllowedOrigin\(request\.getUrl\(\)\)/);
    expect(android).toMatch(/!isAllowedOrigin\(request\.getOrigin\(\)\)/);
    expect(android).toMatch(/RESOURCE_VIDEO_CAPTURE/);
    expect(android).toMatch(/RESOURCE_AUDIO_CAPTURE/);
    expect(android).not.toContain("request.grant(request.getResources())");
  });

  it("uses the alarm stream and restores its previous volume", () => {
    expect(android).toMatch(/AudioManager\.STREAM_ALARM/);
    expect(android).toMatch(/getStreamMaxVolume\(AudioManager\.STREAM_ALARM\) \* 0\.80/);
    expect(android).toMatch(/originalAlarmVolume/);
    expect(android).toMatch(/setStreamVolume\(AudioManager\.STREAM_ALARM, originalAlarmVolume/);
    expect(android).not.toContain("AudioManager.STREAM_NOTIFICATION");
  });

  it("keeps one peer connection and candidate queue per remote device", () => {
    expect(app).toMatch(/peers:new Map\(\)/);
    expect(app).toMatch(/state\.peers\.set\(peerInfo\.id,entry\)/);
    expect(app).toMatch(/for\(const peer of present\.values\(\)\)/);
    expect(app).not.toContain("peers[0]");
  });

  it("persists APK provisioning outside WebView localStorage", () => {
    expect(android).toMatch(/getSharedPreferences\(PREFS, MODE_PRIVATE\)/);
    expect(android).toMatch(/@JavascriptInterface public String loadConfig/);
    expect(android).toMatch(/@JavascriptInterface public void saveConfig/);
    expect(app).toMatch(/window\.StepNative\?\.loadConfig/);
    expect(app).toMatch(/window\.StepNative\?\.saveConfig/);
  });

  it("keeps immersive fullscreen and auto-hides the controls after five seconds", () => {
    expect(android).toMatch(/SYSTEM_UI_FLAG_IMMERSIVE_STICKY/);
    expect(android).toMatch(/onWindowFocusChanged/);
    expect(app).toMatch(/controls-hidden/);
    expect(app).toMatch(/function validControlsTimeout/);
    expect(app).toMatch(/controlsTimeout\?\?5/);
    expect(html).toContain('<option value="5" selected>5秒（標準）</option>');
    for (const value of [3, 5, 8, 10, 15, 0]) {
      expect(html).toContain(`<option value="${value}"`);
    }
    expect(app).toMatch(/Math\.abs\(dy\)>60/);
    expect(app).toMatch(/if\(dy>0\)hideControls\(\)/);
  });

  it("creates video tiles only for live streams and removes stale frames", () => {
    expect(app).toMatch(/requestAnimationFrame/);
    expect(app).toMatch(/pc\.ontrack=.*event\.streams&&event\.streams\[0\]/);
    expect(app).toMatch(/entry\.remoteStream\.addTrack\(event\.track\)/);
    expect(app).toMatch(/if\(video\)video\.srcObject=null/);
    expect(app).toMatch(/if\(removeTile\)entry\.tile\.remove\(\)/);
    expect(app).toMatch(/state\.peers\.delete\(peerId\)/);
    expect(html).toContain("接続相手を待っています");
  });

  it("uses deterministic negotiation and Fire-compatible ICE recovery", () => {
    expect(app).toMatch(/function isInitiator\(peerId\)/);
    expect(app).toMatch(/iceConnectionState==="completed"/);
    expect(app).toMatch(/pc\.oniceconnectionstatechange/);
    expect(app).toMatch(/schedulePeerRecovery\(entry,12000\)/);
    expect(app).toMatch(/entry\.pc\.signalingState!=="stable"/);
    expect(app).toMatch(/createOffer\(\{iceRestart:replace\}\)/);
    expect(app).toMatch(/restart:true/);
    expect(worker).toMatch(/message\.restart !== true/);
  });

  it("shows WebRTC diagnostics only from settings", () => {
    expect(html).toContain('id="diagnostics-toggle"');
    expect(html).toContain('id="diagnostics" class="diagnostics hidden"');
    expect(app).toMatch(/WebSocket:/);
    expect(app).toMatch(/signaling=.*ice=.*connection=.*tracks=/);
  });

  it("persists and shares the configurable tablet name", () => {
    expect(html).toContain('id="settings-tablet-name"');
    expect(app).toMatch(/tabletName:\(value\.tabletName/);
    expect(app).toMatch(/body:JSON\.stringify\(\{deviceId:saved\.deviceId,tabletName:saved\.tabletName\}\)/);
    expect(worker).toMatch(/displayNameForDevice\(identity\.canonical, body\.tabletName\)/);
  });

  it("generates short-lived TURN credentials without exposing the long-lived key", () => {
    expect(worker).toMatch(/credentials\/generate-ice-servers/);
    expect(worker).toMatch(/ttl: 46800/);
    expect(worker).toMatch(/Bearer \$\{env\.TURN_KEY_API_TOKEN\}/);
    expect(worker).toMatch(/!\/:53/);
    expect(worker).not.toMatch(/TURN_KEY_API_TOKEN.*json\(/);
  });
});
