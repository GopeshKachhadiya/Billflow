package com.billflow.app.crypto

import com.google.gson.Gson
import com.google.gson.JsonObject
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object DataEncryptor {

    private var encryptionKey: ByteArray? = null
    private val gson = Gson()

    fun setKey(key: ByteArray) {
        encryptionKey = key
    }

    fun clearKey() {
        encryptionKey = null
    }

    fun getKey(): ByteArray? {
        return encryptionKey
    }

    data class EncryptedResult(
        val encryptedData: String,
        val iv: String,
        val authTag: String
    )

    fun encrypt(text: String, key: ByteArray): EncryptedResult {
        val random = SecureRandom()
        val iv = ByteArray(12)
        random.nextBytes(iv)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)

        val textBytes = text.toByteArray(Charsets.UTF_8)
        val encryptedBytesWithTag = cipher.doFinal(textBytes)

        val ciphertextLength = encryptedBytesWithTag.size - 16
        val ciphertext = ByteArray(ciphertextLength)
        val authTag = ByteArray(16)

        System.arraycopy(encryptedBytesWithTag, 0, ciphertext, 0, ciphertextLength)
        System.arraycopy(encryptedBytesWithTag, ciphertextLength, authTag, 0, 16)

        return EncryptedResult(
            encryptedData = KeyDerivation.bytesToHex(ciphertext),
            iv = KeyDerivation.bytesToHex(iv),
            authTag = KeyDerivation.bytesToHex(authTag)
        )
    }

    fun decrypt(encryptedDataHex: String, ivHex: String, authTagHex: String, key: ByteArray): String {
        val ciphertext = KeyDerivation.hexToBytes(encryptedDataHex)
        val authTag = KeyDerivation.hexToBytes(authTagHex)
        val iv = KeyDerivation.hexToBytes(ivHex)

        // Reconstruct [ciphertext | authTag] for Java GCM decryption
        val encryptedBytesWithTag = ByteArray(ciphertext.size + authTag.size)
        System.arraycopy(ciphertext, 0, encryptedBytesWithTag, 0, ciphertext.size)
        System.arraycopy(authTag, 0, encryptedBytesWithTag, ciphertext.size, authTag.size)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = SecretKeySpec(key, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

        val decryptedBytes = cipher.doFinal(encryptedBytesWithTag)
        return String(decryptedBytes, Charsets.UTF_8)
    }

    fun encryptObject(obj: Any): EncryptedResult {
        val key = getKey() ?: throw IllegalStateException("Encryption key not set")
        val json = gson.toJson(obj)
        return encrypt(json, key)
    }

    fun <T> decryptObject(encryptedData: String, iv: String, authTag: String, classOfT: Class<T>): T {
        val key = getKey() ?: throw IllegalStateException("Encryption key not set")
        val decryptedJson = decrypt(encryptedData, iv, authTag, key)
        return gson.fromJson(decryptedJson, classOfT)
    }

    // Helper functions for decrypting database records into UI Models
    fun decryptCustomerJson(encryptedData: String, iv: String, authTag: String): JsonObject {
        val key = getKey() ?: throw IllegalStateException("Encryption key not set")
        val decryptedJson = decrypt(encryptedData, iv, authTag, key)
        return gson.fromJson(decryptedJson, JsonObject::class.java)
    }

    fun decryptItemJson(encryptedData: String, iv: String, authTag: String): JsonObject {
        val key = getKey() ?: throw IllegalStateException("Encryption key not set")
        val decryptedJson = decrypt(encryptedData, iv, authTag, key)
        return gson.fromJson(decryptedJson, JsonObject::class.java)
    }

    fun decryptBillJson(encryptedData: String, iv: String, authTag: String): JsonObject {
        val key = getKey() ?: throw IllegalStateException("Encryption key not set")
        val decryptedJson = decrypt(encryptedData, iv, authTag, key)
        return gson.fromJson(decryptedJson, JsonObject::class.java)
    }
}
