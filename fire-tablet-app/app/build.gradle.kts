plugins {
    id("com.android.application")
}

android {
    namespace = "jp.stepkobetsu.dekakun"
    compileSdk = 35

    defaultConfig {
        applicationId = "jp.stepkobetsu.dekakun"
        minSdk = 21
        targetSdk = 28
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}
