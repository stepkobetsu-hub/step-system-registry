#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-fire-app/generated}"
rm -rf "$ROOT"
mkdir -p "$ROOT/app/src/main/java/jp/stepkobetsu/shuttaikun/fire" \
         "$ROOT/app/src/main/res/drawable-nodpi" \
         "$ROOT/app/src/main/res/values"

cat > "$ROOT/settings.gradle" <<'EOF'
pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = 'ShuttaikunFire'
include ':app'
EOF

cat > "$ROOT/build.gradle" <<'EOF'
plugins {
    id 'com.android.application' version '8.7.3' apply false
}
EOF

cat > "$ROOT/app/build.gradle" <<'EOF'
plugins { id 'com.android.application' }
android {
    namespace 'jp.stepkobetsu.shuttaikun.fire'
    compileSdk 35
    defaultConfig {
        applicationId 'jp.stepkobetsu.shuttaikun.fire'
        minSdk 22
        targetSdk 28
        versionCode 103
        versionName '1.0.3'
    }
}
EOF

cat > "$ROOT/app/src/main/res/values/strings.xml" <<'EOF'
<resources><string name="app_name">出退くん</string></resources>
EOF

cat > "$ROOT/app/src/main/res/values/styles.xml" <<'EOF'
<resources>
  <style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar">
    <item name="android:windowFullscreen">true</item>
    <item name="android:colorAccent">#2E8B65</item>
    <item name="android:navigationBarColor">#000000</item>
  </style>
</resources>
EOF

cat > "$ROOT/app/src/main/AndroidManifest.xml" <<'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-feature android:name="android.hardware.camera.any" android:required="false" />
  <application android:allowBackup="false" android:hardwareAccelerated="true" android:icon="@drawable/shuttaikun_icon" android:label="@string/app_name" android:supportsRtl="true" android:theme="@style/AppTheme" android:usesCleartextTraffic="false">
    <activity android:name=".MainActivity" android:configChanges="keyboardHidden|orientation|screenSize" android:exported="true" android:screenOrientation="landscape">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
EOF

cat > "$ROOT/app/src/main/java/jp/stepkobetsu/shuttaikun/fire/MainActivity.java" <<'EOF'
package jp.stepkobetsu.shuttaikun.fire;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String CHECKIN_URL = "https://step-checkin-edge-staging.stepkobetsu.workers.dev/legacy-tablet";
    private static final String ALLOWED_HOST = "step-checkin-edge-staging.stepkobetsu.workers.dev";
    private static final int CAMERA_REQUEST = 41;
    private WebView webView;
    private PermissionRequest pendingWebPermission;
    private boolean sleeping = false;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        applyKeepScreenState();
        hideSystemUi();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new SleepControlBridge(), "SleepControl");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isTrustedUri(request == null ? null : request.getUrl());
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !isTrustedUri(url == null ? null : Uri.parse(url));
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    if (request == null || !isTrustedUri(request.getOrigin())) {
                        if (request != null) request.deny();
                        return;
                    }
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                            || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        grantCameraOnly(request);
                    } else {
                        pendingWebPermission = request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_REQUEST);
                    }
                });
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_REQUEST);
        }
        webView.loadUrl(CHECKIN_URL);
    }

    private boolean isTrustedUri(Uri uri) {
        return uri != null
                && "https".equalsIgnoreCase(uri.getScheme())
                && ALLOWED_HOST.equalsIgnoreCase(uri.getHost());
    }

    private void grantCameraOnly(PermissionRequest request) {
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                return;
            }
        }
        request.deny();
    }

    public final class SleepControlBridge {
        @JavascriptInterface
        public void setSleeping(final boolean value) {
            runOnUiThread(() -> {
                sleeping = value;
                applyKeepScreenState();
            });
        }
    }

    private void applyKeepScreenState() {
        if (sleeping) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_REQUEST && pendingWebPermission != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                grantCameraOnly(pendingWebPermission);
            } else {
                pendingWebPermission.deny();
            }
            pendingWebPermission = null;
        }
    }

    @Override protected void onResume() {
        super.onResume();
        hideSystemUi();
        applyKeepScreenState();
        if (webView != null) webView.onResume();
    }

    @Override protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else hideSystemUi();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("SleepControl");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
        }
        super.onDestroy();
    }
}
EOF

echo "Generated Fire app project at $ROOT"
