package jp.stepkobetsu.classroomvideo;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class MainActivity extends Activity {
    private static final int MEDIA_PERMISSION_REQUEST = 10;
    private static final String PREFS = "step_video_device";
    private static final String PREF_CONFIG = "config_json";
    private static final String PREF_INSTALLATION_ID = "installation_id";
    private WebView webView;
    private long backgroundedAt;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        enterImmersiveMode();
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            (!hasPermission(Manifest.permission.CAMERA) || !hasPermission(Manifest.permission.RECORD_AUDIO))) {
            requestPermissions(new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, MEDIA_PERMISSION_REQUEST);
        } else {
            webView.loadUrl(initialUrl(getIntent()));
        }
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.addJavascriptInterface(new StepNativeBridge(), "StepNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isAllowedOrigin(request.getUrl());
            }
            @SuppressWarnings("deprecation")
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !isAllowedOrigin(Uri.parse(url));
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (!isAllowedOrigin(Uri.parse(url))) view.stopLoading();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (!isAllowedOrigin(request.getOrigin())) { request.deny(); return; }
                    List<String> allowed = new ArrayList<>();
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) && hasPermission(Manifest.permission.CAMERA)) allowed.add(resource);
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) && hasPermission(Manifest.permission.RECORD_AUDIO)) allowed.add(resource);
                    }
                    if (allowed.isEmpty()) request.deny(); else request.grant(allowed.toArray(new String[0]));
                });
            }
        });
    }

    private String initialUrl(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        return isAllowedOrigin(data) && data.getFragment() != null ? data.toString() : BuildConfig.APP_URL;
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (webView != null) webView.loadUrl(initialUrl(intent));
    }

    private boolean hasPermission(String permission) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        if (code == MEDIA_PERMISSION_REQUEST && results.length == 2 &&
            results[0] == PackageManager.PERMISSION_GRANTED &&
            results[1] == PackageManager.PERMISSION_GRANTED) {
            webView.loadUrl(initialUrl(getIntent()));
        }
    }

    @Override public void onBackPressed() { /* 教室端末で誤って終了しない */ }
    @Override protected void onResume() {
        super.onResume();
        enterImmersiveMode();
        if (webView != null) webView.onResume();
        if (backgroundedAt > 0L && webView != null) {
            long elapsed = SystemClock.elapsedRealtime() - backgroundedAt;
            backgroundedAt = 0L;
            if (elapsed >= 8000L) webView.postDelayed(() -> webView.evaluateJavascript(
                "window.StepVideoNativeResume&&window.StepVideoNativeResume(" + elapsed + ")", null), 300L);
        }
    }
    @Override protected void onPause() {
        backgroundedAt = SystemClock.elapsedRealtime();
        if (webView != null) webView.onPause();
        super.onPause();
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) enterImmersiveMode(); }

    private boolean isAllowedOrigin(Uri candidate) {
        Uri expected = Uri.parse(BuildConfig.APP_URL);
        return candidate != null && expected.getScheme() != null && expected.getScheme().equalsIgnoreCase(candidate.getScheme()) &&
            expected.getHost() != null && expected.getHost().equalsIgnoreCase(candidate.getHost()) && effectivePort(expected) == effectivePort(candidate);
    }

    private int effectivePort(Uri uri) {
        if (uri.getPort() != -1) return uri.getPort();
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }

    private final class StepNativeBridge {
        private final Handler alarmHandler = new Handler(Looper.getMainLooper());
        private Integer originalAlarmVolume;
        private Runnable restoreAlarmVolume;

        @JavascriptInterface public void setActive(boolean active) {
            runOnUiThread(() -> {
                if (active) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface public String loadConfig() {
            return getSharedPreferences(PREFS, MODE_PRIVATE).getString(PREF_CONFIG, "");
        }

        @JavascriptInterface public String getInstallationId() {
            SharedPreferences preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
            String existing = preferences.getString(PREF_INSTALLATION_ID, "");
            if (existing != null && !existing.isEmpty()) return existing;
            String created = UUID.randomUUID().toString();
            preferences.edit().putString(PREF_INSTALLATION_ID, created).commit();
            return created;
        }

        @JavascriptInterface public void saveConfig(String json) {
            if (json == null || json.length() > 8192) return;
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(PREF_CONFIG, json).apply();
        }

        @JavascriptInterface public void clearConfig() {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(PREF_CONFIG).apply();
        }

        @JavascriptInterface public void exitApp() {
            runOnUiThread(() -> finishAndRemoveTask());
        }

        @JavascriptInterface public void restartApp() {
            runOnUiThread(() -> {
                Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
                if (launchIntent == null) { recreate(); return; }
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(launchIntent);
            });
        }

        @JavascriptInterface public void playChime() {
            runOnUiThread(() -> {
                AudioManager audio = (AudioManager) getSystemService(AUDIO_SERVICE);
                if (restoreAlarmVolume != null) alarmHandler.removeCallbacks(restoreAlarmVolume);
                if (originalAlarmVolume == null) originalAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM);
                int target = Math.max(1, (int) Math.ceil(audio.getStreamMaxVolume(AudioManager.STREAM_ALARM) * 0.80));
                try {
                    if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < target) audio.setStreamVolume(AudioManager.STREAM_ALARM, target, 0);
                } catch (RuntimeException ignored) { }
                ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_ALARM, 85);
                for (int delay = 0; delay <= 3000; delay += 1000) {
                    final int baseDelay = delay;
                    alarmHandler.postDelayed(() -> tone.startTone(ToneGenerator.TONE_DTMF_8, 180), baseDelay);
                    alarmHandler.postDelayed(() -> tone.startTone(ToneGenerator.TONE_DTMF_9, 180), baseDelay + 220);
                    alarmHandler.postDelayed(() -> tone.startTone(ToneGenerator.TONE_PROP_ACK, 260), baseDelay + 440);
                }
                restoreAlarmVolume = () -> {
                    tone.release();
                    if (originalAlarmVolume != null) {
                        try { audio.setStreamVolume(AudioManager.STREAM_ALARM, originalAlarmVolume, 0); }
                        catch (RuntimeException ignored) { }
                    }
                    originalAlarmVolume = null;
                    restoreAlarmVolume = null;
                };
                alarmHandler.postDelayed(restoreAlarmVolume, 4200);
            });
        }
    }
}
