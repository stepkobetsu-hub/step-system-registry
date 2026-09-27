import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const android = readFileSync(new URL("../android/app/src/main/java/jp/stepkobetsu/classroomvideo/MainActivity.java", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/style.css", import.meta.url), "utf8");

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
    expect(app).toMatch(/ws\?\.close\(\)/);
    expect(app).toMatch(/state\.wakeLock\?\.release\(\)/);
    expect(worker).toMatch(/serverNow: Date\.now\(\)/);
  });

  it("keeps a lightweight standby connection and wakes when another tablet joins", () => {
    expect(app).toMatch(/mode=standby/);
    expect(app).toMatch(/message\.type==="wake"/);
    expect(app).toMatch(/startStandby\(\)/);
    expect(app).toMatch(/function enterRest\(\).*startStandby\(\)/);
    expect(worker).toMatch(/mode === "active".*type: "wake"/s);
    expect(worker).toMatch(/peer\.mode !== "active"/);
  });

  it("skips stale sockets without interrupting signaling", () => {
    expect(worker).toMatch(/socket\.readyState !== WebSocket\.OPEN/);
    expect(worker).toMatch(/private safeSend/);
    expect(worker).toMatch(/websocket_send_skipped/);
    expect(worker).toMatch(/const peers = new Map<string, Attachment>/);
    expect(worker).toMatch(/encodeURIComponent\(session\.name\)/);
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
    expect(app).toMatch(/Math\.abs\(dy\)>=60/);
    expect(app).toMatch(/if\(dy>0\)hideControls\(\)/);
    expect(app).toMatch(/addEventListener\("touchstart"/);
    expect(app).toMatch(/addEventListener\("touchend"/);
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

  it("shows the featured classroom and reveals controls on a screen tap", () => {
    expect(html).toContain('id="featured-name"');
    expect(app).toMatch(/ui\["featured-name"\]\.textContent=featured\?\.name/);
    expect(app).toMatch(/else showControls\(\);/);
  });

  it("restarts on a double tap and exits on a triple tap", () => {
    expect(html).toContain("2回：再起動／3回：完全終了");
    expect(app).toMatch(/state\.hangupTaps\+=1/);
    expect(app).toMatch(/state\.hangupTaps===2/);
    expect(app).toMatch(/setTimeout\(restartApplication,900\)/);
    expect(app).toMatch(/StepNative\?\.restartApp/);
    expect(app).toMatch(/StepNative\?\.exitApp/);
    expect(android).toMatch(/@JavascriptInterface public void restartApp/);
    expect(android).toMatch(/getLaunchIntentForPackage\(getPackageName\(\)\)/);
    expect(android).toMatch(/Intent\.FLAG_ACTIVITY_NEW_TASK \| Intent\.FLAG_ACTIVITY_CLEAR_TASK/);
    expect(android).toMatch(/startActivity\(launchIntent\)/);
    expect(android).toMatch(/@JavascriptInterface public void exitApp/);
    expect(android).toMatch(/finishAndRemoveTask\(\)/);
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

  it("restarts the APK when real inbound media or WebSocket traffic stalls", () => {
    expect(app).toMatch(/pc\.getStats\(\)/);
    expect(app).toMatch(/report\.type!=="inbound-rtp"/);
    expect(app).toMatch(/bytesReceived/);
    expect(app).toMatch(/framesDecoded/);
    expect(app).toMatch(/limit=attempt\?8000:18000/);
    expect(app).toMatch(/state\.lastPongAt>55000|now-state\.lastPongAt>55000/);
    expect(app).toMatch(/setInterval\(runWatchdog,5000\)/);
    expect(app).toMatch(/removeFrozenFrame\(entry\)/);
  });

  it("prevents restart loops and restarts after a long background pause", () => {
    expect(app).toMatch(/now-previous\.at<60000/);
    expect(app).toMatch(/!navigator\.onLine/);
    expect(app).toMatch(/RESTART_CONNECT_KEY,"resume"/);
    expect(app).toMatch(/StepVideoNativeResume/);
    expect(android).toMatch(/SystemClock\.elapsedRealtime\(\)/);
    expect(android).toMatch(/elapsed >= 8000L/);
    expect(android).toMatch(/evaluateJavascript/);
  });

  it("shows WebRTC diagnostics only from settings", () => {
    expect(html).toContain('id="diagnostics-toggle"');
    expect(html).toContain('id="diagnostics" class="diagnostics hidden"');
    expect(app).toMatch(/WebSocket:/);
    expect(app).toMatch(/signaling=.*ice=.*connection=.*tracks=/);
  });

  it("keeps the selected tablet name aligned with the internal device id", () => {
    expect(html).toContain('id="settings-tablet-name"');
    for (const id of ["jinryo-1", "jinryo-2", "jinryo-3", "otemachi-1", "otemachi-2", "otemachi-3"]) {
      expect(html).toContain(`option value="${id}"`);
    }
    expect(app).toMatch(/tabletName:defaultTabletName\(deviceId\)/);
    expect(app).toMatch(/body:JSON\.stringify\(\{deviceId:config\.deviceId\}\)/);
    expect(worker).toMatch(/displayNameForDevice\(identity\.canonical\)/);
  });

  it("routes calls only to the opposite campus and closes acknowledged alerts", () => {
    expect(worker).toMatch(/campusOfDevice\(sender\.id\)/);
    expect(worker).toMatch(/broadcastToCampus\(senderCampus === "jinryo" \? "otemachi" : "jinryo"/);
    expect(worker).toMatch(/type: "call-acknowledged"/);
    expect(app).toMatch(/message\.type==="call-acknowledged"/);
  });

  it("marks only the local device and fully resets realtime state on stop", () => {
    expect(app).toMatch(/function setSelfLabel/);
    expect(app).toMatch(/marker\.className="self-marker"/);
    expect(app).toMatch(/caption\.textContent=peer\.name/);
    expect(app).toMatch(/state\.candidateQueues\.clear\(\)/);
    expect(app).toMatch(/state\.generation\+=1/);
    expect(app).toMatch(/state\.featuredPeerId=null/);
    expect(app).toMatch(/ui\["remote-grid"\]\.textContent=""/);
  });

  it("generates short-lived TURN credentials without exposing the long-lived key", () => {
    expect(worker).toMatch(/credentials\/generate-ice-servers/);
    expect(worker).toMatch(/ttl: 46800/);
    expect(worker).toMatch(/Bearer \$\{env\.TURN_KEY_API_TOKEN\}/);
    expect(worker).toMatch(/!\/:53/);
    expect(worker).not.toMatch(/TURN_KEY_API_TOKEN.*json\(/);
  });

  it("shows remote camera and microphone off states without false freeze recovery", () => {
    expect(worker).toMatch(/message\.type === "media-state"/);
    expect(worker).toMatch(/type: "media-state", from: sender\.id/);
    expect(app).toContain("📹 ビデオ OFF");
    expect(app).toContain("🎤 マイク OFF");
    expect(app).toMatch(/function sendMediaState/);
    expect(app).toMatch(/remoteMedia\?\.audio===false&&remoteMedia\?\.video===false/);
    expect(css).toMatch(/\.camera-off/);
    expect(css).toMatch(/\.mic-off/);
  });
});
