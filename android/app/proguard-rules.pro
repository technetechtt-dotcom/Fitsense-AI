# FitSense AI - ProGuard / R8 rules.
# Keep just enough symbols for ARCore, Firebase serialization, and Hilt to survive R8.

# --- Kotlin & Coroutines ---
-keepclassmembernames class kotlinx.** { *; }
-dontwarn kotlinx.coroutines.**

# --- Kotlin Serialization ---
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keep,includedescriptorclasses class com.fitsense.ai.**$$serializer { *; }
-keepclassmembers class com.fitsense.ai.** {
    *** Companion;
}
-keepclasseswithmembers class com.fitsense.ai.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# --- ARCore ---
-keep class com.google.ar.core.** { *; }
-dontwarn com.google.ar.core.**

# --- OpenCV ---
-keep class org.opencv.** { *; }
-dontwarn org.opencv.**

# --- Firebase ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# --- Hilt / Dagger ---
-keep class dagger.hilt.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper

# Generated R8 metadata
-keepattributes Signature, SourceFile, LineNumberTable
