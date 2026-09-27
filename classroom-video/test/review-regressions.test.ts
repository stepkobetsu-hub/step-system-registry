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
    const values = [...html.matchAll(/<option value="(\d+)"/g)].map((match) => Number(match[1]));
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
    expect(android).toMatch(/getStreamMaxVolume\(AudioManager\.STREAM_ALARM\) \* 0\.65/);
    expect(android).toMatch(/originalAlarmVolume/);
    expect(android).toMatch(/setStreamVolume\(AudioManager\.STREAM_ALARM, originalAlarmVolume/);
    expect(android).not.toContain("AudioManager.STREAM_NOTIFICATION");
  });

  it("generates short-lived TURN credentials without exposing the long-lived key", () => {
    expect(worker).toMatch(/credentials\/generate-ice-servers/);
    expect(worker).toMatch(/ttl: 46800/);
    expect(worker).toMatch(/Bearer \$\{env\.TURN_KEY_API_TOKEN\}/);
    expect(worker).toMatch(/!\/:53/);
    expect(worker).not.toMatch(/TURN_KEY_API_TOKEN.*json\(/);
  });
});
