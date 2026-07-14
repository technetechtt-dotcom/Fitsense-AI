package com.fitsense.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.LocalMall
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.fitsense.ai.models.ShoeMatch
import com.fitsense.ai.ui.theme.FitSenseColors

@Composable
fun ShoeCard(
    match: ShoeMatch,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(FitSenseColors.Surface3),
                contentAlignment = Alignment.Center,
            ) {
                if (match.imageUrl != null) {
                    AsyncImage(
                        model = match.imageUrl,
                        contentDescription = match.model,
                        modifier = Modifier.fillMaxWidth(),
                    )
                } else {
                    Icon(
                        imageVector = Icons.Rounded.LocalMall,
                        contentDescription = null,
                        tint = FitSenseColors.Neon,
                    )
                }
            }

            Column(
                modifier = Modifier.padding(end = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = match.brand.uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = FitSenseColors.OnSurfaceMuted,
                )
                Text(
                    text = match.model,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "EU ${match.recommendedEuSize}  •  Fit ${match.fitScore}%  •  Comfort ${match.comfortScore}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = FitSenseColors.OnSurfaceMuted,
                )
            }
        }
    }
}
