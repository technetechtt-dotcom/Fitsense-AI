package com.fitsense.ai.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material.icons.rounded.ViewInAr
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.R
import com.fitsense.ai.ui.components.MeasurementCard
import com.fitsense.ai.ui.components.PrimaryButton
import com.fitsense.ai.ui.components.SectionHeader
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    onStartScan: () -> Unit,
    onOpenMeasurements: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenRecommendations: (scanId: String) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val profile by viewModel.profile.collectAsState()
    val recentScans by viewModel.recentScans.collectAsState()

    val displayName = profile?.displayName?.takeIf { it.isNotBlank() }
        ?: stringResource(R.string.home_guest)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            HomeHeader(name = displayName)

            HeroCard(onStartScan = onStartScan)

            QuickActionsGrid(
                onMeasurements = onOpenMeasurements,
                onSettings = onOpenSettings,
                onRecommendations = {
                    recentScans.firstOrNull()?.scanId?.let(onOpenRecommendations)
                },
            )

            SectionHeader(title = stringResource(R.string.home_section_recent))

            if (recentScans.isEmpty()) {
                EmptyRecentScansHint(onStartScan = onStartScan)
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 32.dp),
                ) {
                    items(recentScans, key = { it.scanId }) { scan ->
                        MeasurementCard(scan = scan, onClick = { onOpenRecommendations(scan.scanId) })
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeHeader(name: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(top = 16.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(
            text = stringResource(R.string.home_hello),
            style = MaterialTheme.typography.bodyMedium,
            color = FitSenseColors.OnSurfaceMuted,
        )
        Text(
            text = name,
            style = MaterialTheme.typography.headlineLarge,
            color = FitSenseColors.OnSurface,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = stringResource(R.string.home_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = FitSenseColors.Neon,
        )
    }
}

@Composable
private fun HeroCard(onStartScan: () -> Unit) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Box(
            modifier = Modifier
                .background(Brush.linearGradient(
                    listOf(FitSenseColors.Violet, FitSenseColors.Neon),
                ))
                .padding(24.dp)
                .fillMaxWidth(),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = stringResource(R.string.app_tagline).uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = FitSenseColors.Surface0,
                )
                Text(
                    text = "Scan once.\nFit perfectly.",
                    style = MaterialTheme.typography.displayMedium,
                    color = FitSenseColors.Surface0,
                    fontWeight = FontWeight.ExtraBold,
                )
                PrimaryButton(
                    text = stringResource(R.string.home_action_scan),
                    onClick = onStartScan,
                    gradient = Brush.linearGradient(
                        listOf(FitSenseColors.Surface0, FitSenseColors.Surface1),
                    ),
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Rounded.ViewInAr,
                            contentDescription = null,
                            tint = FitSenseColors.Neon,
                        )
                    },
                )
            }
        }
    }
}

@Composable
private fun QuickActionsGrid(
    onMeasurements: () -> Unit,
    onSettings: () -> Unit,
    onRecommendations: () -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        QuickAction(
            modifier = Modifier.weight(1f),
            icon = Icons.Rounded.History,
            label = stringResource(R.string.home_action_measurements),
            onClick = onMeasurements,
        )
        QuickAction(
            modifier = Modifier.weight(1f),
            icon = Icons.Rounded.Storefront,
            label = stringResource(R.string.home_action_recommendations),
            onClick = onRecommendations,
        )
        QuickAction(
            modifier = Modifier.weight(1f),
            icon = Icons.Rounded.Settings,
            label = stringResource(R.string.home_action_settings),
            onClick = onSettings,
        )
    }
}

@Composable
private fun QuickAction(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = modifier.height(100.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(FitSenseColors.Surface3),
                contentAlignment = Alignment.Center,
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = FitSenseColors.Neon)
            }
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 2,
            )
        }
    }
}

@Composable
private fun EmptyRecentScansHint(onStartScan: () -> Unit) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        onClick = onStartScan,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(imageVector = Icons.Rounded.ViewInAr, contentDescription = null, tint = FitSenseColors.Neon)
            Text(
                text = stringResource(R.string.home_section_recent_empty),
                style = MaterialTheme.typography.bodyMedium,
                color = FitSenseColors.OnSurfaceMuted,
            )
        }
    }
}
