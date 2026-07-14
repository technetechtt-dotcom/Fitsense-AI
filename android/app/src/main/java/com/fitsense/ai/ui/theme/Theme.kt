package com.fitsense.ai.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColors = darkColorScheme(
    primary = FitSenseColors.Neon,
    onPrimary = FitSenseColors.Surface0,
    primaryContainer = FitSenseColors.Surface3,
    onPrimaryContainer = FitSenseColors.OnSurface,
    secondary = FitSenseColors.Lime,
    onSecondary = FitSenseColors.Surface0,
    tertiary = FitSenseColors.Violet,
    onTertiary = FitSenseColors.OnSurface,
    background = FitSenseColors.Surface0,
    onBackground = FitSenseColors.OnSurface,
    surface = FitSenseColors.Surface1,
    onSurface = FitSenseColors.OnSurface,
    surfaceVariant = FitSenseColors.Surface2,
    onSurfaceVariant = FitSenseColors.OnSurfaceMuted,
    error = FitSenseColors.Coral,
    onError = FitSenseColors.Surface0,
    outline = FitSenseColors.OnSurfaceMuted,
)

private val LightColors = lightColorScheme(
    primary = FitSenseColors.Violet,
    onPrimary = Color.White,
    primaryContainer = FitSenseColors.Surface2Light,
    onPrimaryContainer = FitSenseColors.OnSurfaceLight,
    secondary = FitSenseColors.Neon,
    onSecondary = FitSenseColors.OnSurfaceLight,
    tertiary = FitSenseColors.Violet,
    background = FitSenseColors.Surface0Light,
    onBackground = FitSenseColors.OnSurfaceLight,
    surface = FitSenseColors.Surface1Light,
    onSurface = FitSenseColors.OnSurfaceLight,
    surfaceVariant = FitSenseColors.Surface2Light,
    onSurfaceVariant = FitSenseColors.OnSurfaceMutedLight,
    error = FitSenseColors.Coral,
    onError = Color.White,
)

@Composable
fun FitSenseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colors,
        typography = FitSenseTypography,
        shapes = FitSenseShapes,
        content = content,
    )
}
