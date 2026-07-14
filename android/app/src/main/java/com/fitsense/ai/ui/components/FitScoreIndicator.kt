package com.fitsense.ai.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.fitsense.ai.ui.theme.FitSenseColors

/** Circular score ring with a centered percentage label. */
@Composable
fun FitScoreIndicator(
    label: String,
    percent: Int,
    modifier: Modifier = Modifier,
    sizeDp: Int = 88,
) {
    val animated by animateFloatAsState(
        targetValue = (percent.coerceIn(0, 100)) / 100f,
        animationSpec = tween(durationMillis = 600),
        label = "fit-score-ring",
    )

    Box(modifier = modifier.size(sizeDp.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(sizeDp.dp)) {
            val stroke = 8.dp.toPx()
            // Track
            drawArc(
                color = FitSenseColors.Surface3,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = stroke),
                topLeft = Offset(stroke / 2f, stroke / 2f),
                size = Size(size.width - stroke, size.height - stroke),
            )
            // Progress
            drawArc(
                brush = FitSenseColors.ScanGradient,
                startAngle = -90f,
                sweepAngle = animated * 360f,
                useCenter = false,
                style = Stroke(width = stroke),
                topLeft = Offset(stroke / 2f, stroke / 2f),
                size = Size(size.width - stroke, size.height - stroke),
            )
        }
        androidx.compose.foundation.layout.Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$percent%",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = FitSenseColors.OnSurfaceMuted,
            )
        }
    }
}
