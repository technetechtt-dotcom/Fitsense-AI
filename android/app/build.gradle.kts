/*
 * FitSense AI - App module build script.
 *
 * Compose-first Android application module wiring:
 *  • Hilt (Dagger) for DI
 *  • Jetpack Compose + Material 3
 *  • CameraX, ARCore, OpenCV for capture / sensing
 *  • Local DataStore persistence for profile and scans
 *  • Kotlin Serialization for typed payloads
 */

import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
}

// Read optional signing / API config from local.properties (never committed).
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.fitsense.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.fitsense.ai"
        minSdk = 26              // ARCore requires 24+, OpenCV stable on 26+
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables { useSupportLibrary = true }

        // FitSense recommendation tuning knobs surfaced to BuildConfig
        // so they can be tweaked without touching production code.
        buildConfigField("float", "FIT_SCORE_TOLERANCE_MM", "5.0f")
        buildConfigField("float", "WIDE_FOOT_RATIO_THRESHOLD", "0.42f")
        // Override via local.properties: fitsense.api.baseUrl=https://...
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"${localProps.getProperty("fitsense.api.baseUrl", "")}\"",
        )
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlin.RequiresOptIn",
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi",
            "-opt-in=androidx.compose.animation.ExperimentalAnimationApi",
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = libs.versions.composeCompiler.get()
    }

    packaging {
        resources.excludes += setOf(
            "META-INF/AL2.0",
            "META-INF/LGPL2.1",
            "META-INF/LICENSE.md",
            "META-INF/LICENSE-notice.md",
            "/META-INF/{AL2.0,LGPL2.1}",
        )
        // Prefer the camera2 native lib bundled by CameraX
        jniLibs.useLegacyPackaging = false
    }

    // ARCore / OpenCV ship 64-bit only on most distributions; keep ABI filters tight
    // to avoid bloating the APK while still supporting all current devices.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "x86_64")
            isUniversalApk = true
        }
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = true
        warningsAsErrors = false
    }
}

dependencies {
    // Kotlin
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)
    implementation(libs.kotlinx.serialization.json)

    // AndroidX
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.splashscreen)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.exifinterface)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.bundles.compose)
    implementation(libs.androidx.navigation.compose)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    // Hilt
    implementation(libs.hilt.android)
    implementation(libs.hilt.navigation.compose)
    kapt(libs.hilt.compiler)

    // CameraX
    implementation(libs.bundles.camerax)

    // ARCore
    implementation(libs.arcore)

    // OpenCV (Maven Central — `org.opencv:opencv:4.9.0`)
    // If your build can't resolve this artifact (older mirrors), see
    // README "OpenCV fallback" for swapping to a local module / quickbird build.
    implementation(libs.opencv)

    // Misc UX
    implementation(libs.accompanist.permissions)
    implementation(libs.coil.compose)
    implementation(libs.timber)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
}

kapt {
    correctErrorTypes = true
    arguments {
        arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
    }
}
