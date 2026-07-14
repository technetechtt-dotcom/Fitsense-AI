package com.fitsense.ai.ui.screens.results

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.R
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.UiState
import com.fitsense.ai.models.UserPreferences
import com.fitsense.ai.ui.components.ErrorState
import com.fitsense.ai.ui.components.FitScoreIndicator
import com.fitsense.ai.ui.components.LoadingIndicator
import com.fitsense.ai.ui.components.PrimaryButton
import com.fitsense.ai.ui.components.StatTile
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.utils.toPercent
import com.fitsense.ai.viewmodel.ResultsViewModel

@Composable
fun ResultsScreen(
    scanId: String,
    onBack: () -> Unit,
    onSeeShoes: (String) -> Unit,
    onRescan: () -> Unit,
    viewModel: ResultsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val prefs by viewModel.preferences.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
    ) {
        when (val s = state) {
            UiState.Loading -> LoadingIndicator(text = stringResource(R.string.common_loading))
            is UiState.Error -> ErrorState(message = s.message, onRetry = onBack)
            is UiState.Success -> ResultsContent(
                scan = s.data,
                prefs = prefs,
                onBack = onBack,
                onSeeShoes = { onSeeShoes(scanId) },
                onRescan = onRescan,
            )
        }
    }
}

@Composable
private fun ResultsContent(
    scan: ScanResult,
    prefs: UserPreferences,
    onBack: () -> Unit,
    onSeeShoes: () -> Unit,
    onRescan: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.Rounded.ArrowBack,
                    contentDescription = stringResource(R.string.common_cancel),
                    tint = FitSenseColors.OnSurface,
                )
            }
            Text(
                text = stringResource(R.string.results_title),
                style = MaterialTheme.typography.titleLarge,
                color = FitSenseColors.OnSurface,
                fontWeight = FontWeight.SemiBold,
            )
        }

        val foot = scan.primaryFoot
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatTile(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.results_length),
                value = String.format("%.1f", foot?.lengthMm ?: 0.0),
                unit = "mm",
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = stringResource(R.string.results_width),
                value = String.format("%.1f", foot?.widthMm ?: 0.0),
                unit = "mm",
            )
        }

        scan.recommendation?.let { rec ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatTile(modifier = Modifier.weight(1f), label = stringResource(R.string.results_size_uk), value = rec.uk)
                StatTile(modifier = Modifier.weight(1f), label = stringResource(R.string.results_size_us), value = rec.us)
                StatTile(modifier = Modifier.weight(1f), label = stringResource(R.string.results_size_eu), value = rec.eu)
            }
        }

        if (foot != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                FitScoreIndicator(label = "confidence", percent = foot.confidence.toPercent())
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (foot.isWide) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Rounded.Bolt, contentDescription = null, tint = FitSenseColors.Lime)
                            Text(
                                text = stringResource(R.string.results_wide_foot),
                                style = MaterialTheme.typography.titleMedium,
                                color = FitSenseColors.Lime,
                            )
                        }
                    }
                    Text(
                        text = stringResource(R.string.results_confidence, foot.confidence.toPercent()),
                        style = MaterialTheme.typography.bodyMedium,
                        color = FitSenseColors.OnSurfaceMuted,
                    )
                    Text(
                        text = "Calibration: ${foot.calibration.displayName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = FitSenseColors.OnSurfaceMuted,
                    )
                    Text(
                        text = "Units: ${prefs.units.name.lowercase()}",
                        style = MaterialTheme.typography.bodySmall,
                        color = FitSenseColors.OnSurfaceMuted,
                    )
                }
            }
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))

        PrimaryButton(
            text = stringResource(R.string.results_see_shoes),
            onClick = onSeeShoes,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedButton(
            onClick = onRescan,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.results_redo))
        }
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 8.dp))
    }
}
