package com.fitsense.ai.ui.screens.scan

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.fitsense.ai.measurement.Point2D
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.ScanViewModel

@Composable
fun ScanMarkupOverlay(
    bitmap: android.graphics.Bitmap,
    markup: ScanViewModel.MarkupState,
    onMoveLandmark: (ScanViewModel.LandmarkKind, Point2D) -> Unit,
    onSelectLandmark: (ScanViewModel.LandmarkKind) -> Unit,
    onBeginEdit: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var draggingKind by remember { mutableStateOf<ScanViewModel.LandmarkKind?>(null) }
    Column(modifier = modifier) {
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            AsyncImage(
                model = bitmap,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit,
            )
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(markup.imageWidth, markup.imageHeight) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                val kind = nearestLandmark(markup, offset.x, offset.y, size.width, size.height)
                                draggingKind = kind
                                onSelectLandmark(kind)
                                onBeginEdit()
                            },
                            onDrag = { change, _ ->
                                val kind = draggingKind ?: return@detectDragGestures
                                val point = screenToImage(
                                    change.position.x,
                                    change.position.y,
                                    markup.imageWidth,
                                    markup.imageHeight,
                                    size.width,
                                    size.height,
                                )
                                onMoveLandmark(kind, point)
                            },
                            onDragEnd = { draggingKind = null },
                            onDragCancel = { draggingKind = null },
                        )
                    },
            ) {
                val scale = minOf(size.width / markup.imageWidth, size.height / markup.imageHeight)
                val offsetX = (size.width - markup.imageWidth * scale) / 2f
                val offsetY = (size.height - markup.imageHeight * scale) / 2f
                fun toScreen(p: Point2D): Offset =
                    Offset((p.x * scale + offsetX).toFloat(), (p.y * scale + offsetY).toFloat())

                val corners = markup.refCorners.map(::toScreen)
                for (i in corners.indices) {
                    drawLine(
                        FitSenseColors.Neon,
                        corners[i],
                        corners[(i + 1) % 4],
                        strokeWidth = 3f,
                    )
                }
                drawMarker(toScreen(markup.heel), FitSenseColors.Lime, markup.selectedLandmark == ScanViewModel.LandmarkKind.Heel)
                drawMarker(toScreen(markup.toe), FitSenseColors.Lime, markup.selectedLandmark == ScanViewModel.LandmarkKind.Toe)
                drawMarker(toScreen(markup.widthMedial), Color.Cyan, markup.selectedLandmark == ScanViewModel.LandmarkKind.WidthMedial)
                drawMarker(toScreen(markup.widthLateral), Color.Cyan, markup.selectedLandmark == ScanViewModel.LandmarkKind.WidthLateral)
                markup.refCorners.forEachIndexed { index, corner ->
                    val kind = when (index) {
                        0 -> ScanViewModel.LandmarkKind.RefCorner0
                        1 -> ScanViewModel.LandmarkKind.RefCorner1
                        2 -> ScanViewModel.LandmarkKind.RefCorner2
                        else -> ScanViewModel.LandmarkKind.RefCorner3
                    }
                    drawMarker(toScreen(corner), Color.White, markup.selectedLandmark == kind)
                }
            }
        }
        Text(
            text = buildString {
                append("Adjust markers, then accept. ")
                markup.previewLengthMm?.let { append("Length ${"%.1f".format(it)} mm. ") }
                markup.previewWidthMm?.let { append("Width ${"%.1f".format(it)} mm. ") }
                markup.previewConfidence?.let { append("Confidence ${(it * 100).toInt()}%.") }
                if (markup.confidenceNotes.isNotEmpty()) {
                    append("\n")
                    append(markup.confidenceNotes.take(3).joinToString(" · "))
                }
            },
            style = MaterialTheme.typography.bodySmall,
            color = FitSenseColors.OnSurface,
            modifier = Modifier.padding(16.dp),
        )
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawMarker(
    center: Offset,
    color: Color,
    selected: Boolean,
) {
    drawCircle(color, radius = if (selected) 14f else 10f, center = center)
    drawCircle(Color.Black, radius = if (selected) 14f else 10f, center = center, style = Stroke(2f))
}

private fun nearestLandmark(
    markup: ScanViewModel.MarkupState,
    x: Float,
    y: Float,
    viewW: Int,
    viewH: Int,
): ScanViewModel.LandmarkKind {
    val point = screenToImage(x, y, markup.imageWidth, markup.imageHeight, viewW, viewH)
    val candidates = listOf(
        ScanViewModel.LandmarkKind.RefCorner0 to markup.refCorners[0],
        ScanViewModel.LandmarkKind.RefCorner1 to markup.refCorners[1],
        ScanViewModel.LandmarkKind.RefCorner2 to markup.refCorners[2],
        ScanViewModel.LandmarkKind.RefCorner3 to markup.refCorners[3],
        ScanViewModel.LandmarkKind.Heel to markup.heel,
        ScanViewModel.LandmarkKind.Toe to markup.toe,
        ScanViewModel.LandmarkKind.WidthMedial to markup.widthMedial,
        ScanViewModel.LandmarkKind.WidthLateral to markup.widthLateral,
    )
    return candidates.minByOrNull { (_, p) ->
        val dx = p.x - point.x
        val dy = p.y - point.y
        dx * dx + dy * dy
    }?.first ?: ScanViewModel.LandmarkKind.Heel
}

private fun screenToImage(
    x: Float,
    y: Float,
    imageW: Int,
    imageH: Int,
    viewW: Int,
    viewH: Int,
): Point2D {
    val scale = minOf(viewW.toFloat() / imageW, viewH.toFloat() / imageH)
    val offsetX = (viewW - imageW * scale) / 2f
    val offsetY = (viewH - imageH * scale) / 2f
    val ix = ((x - offsetX) / scale).coerceIn(0f, imageW.toFloat())
    val iy = ((y - offsetY) / scale).coerceIn(0f, imageH.toFloat())
    return Point2D(ix.toDouble(), iy.toDouble())
}
