package com.fitsense.ai.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.utils.formatAsHumanDate
import com.fitsense.ai.utils.roundTo

@Composable
fun MeasurementCard(
    scan: ScanResult,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(
                modifier = Modifier.padding(end = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = scan.createdAtEpochMs.formatAsHumanDate(),
                    style = MaterialTheme.typography.labelMedium,
                    color = FitSenseColors.OnSurfaceMuted,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = "${scan.averageLengthMm?.roundTo(1) ?: "—"} mm",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = "• ${scan.averageWidthMm?.roundTo(1) ?: "—"} mm wide",
                        style = MaterialTheme.typography.bodyMedium,
                        color = FitSenseColors.OnSurfaceMuted,
                    )
                }
                scan.recommendation?.let { rec ->
                    Text(
                        text = "UK ${rec.uk}  •  US ${rec.us}  •  EU ${rec.eu}",
                        style = MaterialTheme.typography.bodySmall,
                        color = FitSenseColors.Neon,
                    )
                }
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))
            Icon(
                imageVector = Icons.Rounded.ChevronRight,
                contentDescription = null,
                tint = FitSenseColors.OnSurfaceMuted,
            )
        }
    }
}
