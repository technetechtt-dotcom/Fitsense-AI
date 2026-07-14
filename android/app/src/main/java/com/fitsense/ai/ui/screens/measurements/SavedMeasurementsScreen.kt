package com.fitsense.ai.ui.screens.measurements

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import com.fitsense.ai.ui.components.MeasurementCard
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.MeasurementsViewModel

@Composable
fun SavedMeasurementsScreen(
    onBack: () -> Unit,
    onOpenScan: (String) -> Unit,
    viewModel: MeasurementsViewModel = hiltViewModel(),
) {
    val scans by viewModel.scans.collectAsState()

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
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.Rounded.ArrowBack,
                        contentDescription = null,
                        tint = FitSenseColors.OnSurface,
                    )
                }
                Text(
                    text = stringResource(R.string.measurements_title),
                    style = MaterialTheme.typography.titleLarge,
                    color = FitSenseColors.OnSurface,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            if (scans.isEmpty()) {
                Text(
                    text = stringResource(R.string.measurements_empty),
                    style = MaterialTheme.typography.bodyMedium,
                    color = FitSenseColors.OnSurfaceMuted,
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp),
                ) {
                    items(scans, key = { it.scanId }) { scan ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            MeasurementCard(
                                scan = scan,
                                onClick = { onOpenScan(scan.scanId) },
                                modifier = Modifier.weight(1f),
                            )
                            IconButton(onClick = { viewModel.delete(scan.scanId) }) {
                                Icon(
                                    imageVector = Icons.Rounded.Delete,
                                    contentDescription = stringResource(R.string.measurements_delete),
                                    tint = FitSenseColors.OnSurfaceMuted,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
