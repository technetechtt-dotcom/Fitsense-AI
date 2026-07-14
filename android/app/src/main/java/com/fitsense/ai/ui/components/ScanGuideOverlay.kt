package com.fitsense.ai.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import com.fitsense.ai.ui.theme.FitSenseColors

/**
 * Translucent foot-shaped guide drawn on top of the camera preview.
 *
 * The dashed outline pulses ("scanning") via an infinite Compose animation
 * to give the user a sense of progress while the AR session locks onto a plane.
 */
@Composable
fun ScanGuideOverlay(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "scan-guide-pulse")
    val pulse by transition.animateFloat(
        initialValue = 0.55f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(animation = tween(2400)),
        label = "sweep",
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val footHeight = h * 0.62f
        val footWidth = footHeight * 0.34f
        val top = (h - footHeight) / 2f
        val left = cx - footWidth / 2f

        // Outer dashed silhouette
        drawFootShape(
            topLeft = Offset(left, top),
            size = Size(footWidth, footHeight),
            stroke = Stroke(
                width = 4f,
                pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(
                    floatArrayOf(20f, 14f),
                ),
            ),
            color = FitSenseColors.Neon.copy(alpha = pulse),
        )

        // Inner glow
        drawFootShape(
            topLeft = Offset(left + 6f, top + 6f),
            size = Size(footWidth - 12f, footHeight - 12f),
            stroke = Stroke(width = 1.5f),
            color = FitSenseColors.Neon.copy(alpha = 0.35f * pulse),
        )

        // Scan line sweeping vertically
        val sweepY = top + sweep * footHeight
        drawLine(
            brush = Brush.horizontalGradient(
                listOf(
                    Color.Transparent,
                    FitSenseColors.Lime.copy(alpha = 0.9f),
                    Color.Transparent,
                ),
            ),
            start = Offset(left - 8f, sweepY),
            end = Offset(left + footWidth + 8f, sweepY),
            strokeWidth = 3f,
        )
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawFootShape(
    topLeft: Offset,
    size: Size,
    stroke: Stroke,
    color: Color,
) {
    val path = androidx.compose.ui.graphics.Path().apply {
        val x = topLeft.x; val y = topLeft.y; val w = size.width; val h = size.height
        // Stylised foot outline as a rounded teardrop.
        moveTo(x + w * 0.5f, y)
        cubicTo(
            x + w * 0.95f, y + h * 0.08f,
            x + w * 1.0f, y + h * 0.45f,
            x + w * 0.85f, y + h * 0.65f,
        )
        cubicTo(
            x + w * 0.78f, y + h * 0.80f,
            x + w * 0.82f, y + h * 0.95f,
            x + w * 0.55f, y + h,
        )
        cubicTo(
            x + w * 0.30f, y + h * 1.02f,
            x + w * 0.18f, y + h * 0.95f,
            x + w * 0.16f, y + h * 0.78f,
        )
        cubicTo(
            x + w * 0.10f, y + h * 0.55f,
            x + w * 0.02f, y + h * 0.32f,
            x + w * 0.10f, y + h * 0.18f,
        )
        cubicTo(
            x + w * 0.20f, y + h * 0.05f,
            x + w * 0.35f, y - h * 0.01f,
            x + w * 0.5f, y,
        )
        close()
    }
    drawPath(path = path, color = color, style = stroke)
}
