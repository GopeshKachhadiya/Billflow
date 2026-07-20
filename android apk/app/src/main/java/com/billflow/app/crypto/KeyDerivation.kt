package com.billflow.app.crypto

import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object KeyDerivation {

    fun generateDeviceSalt(): String {
        val random = SecureRandom()
        val salt = ByteArray(16)
        random.nextBytes(salt)
        return bytesToHex(salt)
    }

    fun deriveKey(password: String, saltHex: String): ByteArray {
        val salt = hexToBytes(saltHex)
        val spec = PBEKeySpec(password.toCharArray(), salt, 100000, 256)
        val skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        return skf.generateSecret(spec).encoded
    }

    fun generateVerificationBlob(derivedKey: ByteArray): String {
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(derivedKey)
        return bytesToHex(digest)
    }

    fun verifyKey(derivedKey: ByteArray, verificationBlob: String): Boolean {
        val calculated = generateVerificationBlob(derivedKey)
        return calculated.equals(verificationBlob, ignoreCase = true)
    }

    fun bytesToHex(bytes: ByteArray): String {
        val hexChars = CharArray(bytes.size * 2)
        val hexArray = "0123456789abcdef".toCharArray()
        for (i in bytes.indices) {
            val v = bytes[i].toInt() and 0xFF
            hexChars[i * 2] = hexArray[v ushr 4]
            hexChars[i * 2 + 1] = hexArray[v and 0x0F]
        }
        return String(hexChars)
    }

    fun hexToBytes(hex: String): ByteArray {
        val len = hex.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(hex[i], 16) shl 4) + Character.digit(hex[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }
}
