# ============================================================
# ScopaScore — ProGuard / R8 Rules
# ============================================================

# ---- Capacitor core ----
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod *;
}

# ---- Capacitor plugins ----
-keep class com.capacitorjs.** { *; }

# ---- NativeAudio ----
-keep class com.getcapacitor.community.audio.** { *; }

# ---- Capacitor Firebase Authentication ----
-keep class io.capawesome.capacitorjs.plugins.firebase.authentication.** { *; }

# ---- Capacitor Local Notifications ----
-keep class com.capacitorjs.plugins.localnotifications.** { *; }

# ---- Capacitor Push Notifications ----
-keep class com.capacitorjs.plugins.pushnotifications.** { *; }

# ---- Capacitor App ----
-keep class com.capacitorjs.plugins.app.** { *; }

# ---- Capacitor Camera ----
-keep class com.capacitorjs.plugins.camera.** { *; }

# ---- Capacitor Preferences ----
-keep class com.capacitorjs.plugins.preferences.** { *; }

# ---- Capacitor Browser ----
-keep class com.capacitorjs.plugins.browser.** { *; }

# ---- NotificationReceiver (ScopaScore nativo) ----
-keep class com.giacomo.scopascore.NotificationReceiver { *; }
-keep class com.giacomo.scopascore.MainActivity { *; }

# ---- Firebase ----
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ---- Firebase Firestore ----
-keep class com.google.firestore.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# ---- Protobuf (usato da Firebase) ----
-keep class com.google.protobuf.** { *; }
-dontwarn com.google.protobuf.**

# ---- Facebook SDK ----
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**

# ---- WebView / Chromium ----
-keep class org.chromium.** { *; }
-dontwarn org.chromium.**

# ---- Kotlin ----
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ---- Coroutines ----
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ---- AndroidX ----
-keep class androidx.** { *; }
-dontwarn androidx.**

# ---- OkHttp (usato da Firebase) ----
-dontwarn okhttp3.**
-dontwarn okio.**

# ---- Generali ----
# Mantieni i nomi delle classi per stack trace leggibili
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Non offuscare le eccezioni
-keep public class * extends java.lang.Exception