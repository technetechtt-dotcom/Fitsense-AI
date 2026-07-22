package com.fitsense.ai.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Keystore-backed storage for FitSense API device credentials
 * (deviceId + deviceSecret + refresh token). Ready for challenge-response
 * auth clients; local profile identity remains in [DeviceIdentityService].
 */
@Singleton
class SecureDeviceCredentialStore @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val prefs: SharedPreferences = run {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            FILE_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    data class DeviceCredentials(
        val deviceId: String,
        val deviceSecret: String,
    )

    fun readDeviceCredentials(): DeviceCredentials? {
        val id = prefs.getString(KEY_DEVICE_ID, null) ?: return null
        val secret = prefs.getString(KEY_DEVICE_SECRET, null) ?: return null
        return DeviceCredentials(id, secret)
    }

    fun writeDeviceCredentials(deviceId: String, deviceSecret: String) {
        prefs.edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_SECRET, deviceSecret)
            .apply()
    }

    fun readRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun writeRefreshToken(token: String) {
        prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val FILE_NAME = "fitsense_secure_creds"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_SECRET = "device_secret"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }
}
