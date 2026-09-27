package jp.stepkobetsu.classroomvideo;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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

public final class MainActivity extends Activity {
    private static final int MEDIA_PERMISSION_REQUEST = 10;
    private WebView webView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        webView = new WebView(this);
        setContentView(webView);
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
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) allowed.add(resource);
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) allowed.add(resource);
                    }
                    if (allowed.isEmpty()) request.deny(); else request.grant(allowed.toArray(new String[0]));
                });
            }
        });
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ||
            checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, MEDIA_PERMISSION_REQUEST);
        } else webView.loadUrl(BuildConfig.APP_URL);
    }

    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == MEDIA_PERMISSION_REQUEST && results.length == 2 && results[0] == PackageManager.PERMISSION_GRANTED && results[1] == PackageManager.PERMISSION_GRANTED) webView.loadUrl(BuildConfig.APP_URL);
    }

    @Override public void onBackPressed() { /* 教室端末で誤って終了しない */ }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onPause() { if (webView != null) webView.onPause(); super.onPause(); }

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

        @JavascriptInterface public void playChime() {
            runOnUiThread(() -> {
                AudioManager audio = (AudioManager) getSystemService(AUDIO_SERVICE);
                if (restoreAlarmVolume != null) alarmHandler.removeCallbacks(restoreAlarmVolume);
                if (originalAlarmVolume == null) originalAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM);
                int target = Math.max(1, (int) Math.ceil(audio.getStreamMaxVolume(AudioManager.STREAM_ALARM) * 0.65));
                try {
                    if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < target) audio.setStreamVolume(AudioManager.STREAM_ALARM, target, 0);
                } catch (RuntimeException ignored) { /* DNDや端末ポリシーを無理に突破しない */ }
                ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_ALARM, 65);
                for (int delay = 0; delay <= 2800; delay += 700) {
                    alarmHandler.postDelayed(() -> tone.startTone(ToneGenerator.TONE_PROP_ACK, 320), delay);
                }
                restoreAlarmVolume = () -> {
                    tone.release();
                    if (originalAlarmVolume != null) {
                        try { audio.setStreamVolume(AudioManager.STREAM_ALARM, originalAlarmVolume, 0); }
                        catch (RuntimeException ignored) { /* 現在値を維持 */ }
                    }
                    originalAlarmVolume = null;
                    restoreAlarmVolume = null;
                };
                alarmHandler.postDelayed(restoreAlarmVolume, 3500);
            });
        }
    }
}
