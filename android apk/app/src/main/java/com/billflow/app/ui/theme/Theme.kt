package com.billflow.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ── COLOR PALETTE ────────────────────────────────────────────────────────────
val DeepInk = Color(0xFF302B24)
val DeepInkPressed = Color(0xFF443D32)
val StampGreen = Color(0xFF4A6B3E)
val StampGold = Color(0xFFA88D2E)
val StampRed = Color(0xFF8B3A3A)
val CreamBackground = Color(0xFFF5EFE0)
val CardSurface = Color(0xFFFDFBF3)
val CardSurfaceElevated = Color(0xFFFAF6E6)
val SoftBorder = Color(0xFFE3D9BE)
val TextPrimary = Color(0xFF1A1611)
val TextMuted = Color(0xFF6B614D)
val WhatsAppGreen = Color(0xFF25D366)

private val LightColorScheme = lightColorScheme(
    primary = DeepInk,
    onPrimary = Color.White,
    secondary = StampGreen,
    onSecondary = Color.White,
    background = CreamBackground,
    onBackground = TextPrimary,
    surface = CardSurface,
    onSurface = TextPrimary,
    error = StampRed,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFE9E0D2),
    onPrimary = DeepInk,
    secondary = StampGreen,
    onSecondary = Color.White,
    background = DeepInk,
    onBackground = Color(0xFFF5EFE0),
    surface = Color(0xFF3E372E),
    onSurface = Color(0xFFF5EFE0),
    error = StampRed,
    onError = Color.White
)

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
val Typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.1.sp
    )
)

@Composable
fun BillFlowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
