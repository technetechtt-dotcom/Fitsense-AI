package com.fitsense.ai.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
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
import com.fitsense.ai.models.CalibrationReference
import com.fitsense.ai.models.MeasurementUnit
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val profile by viewModel.profile.collectAsState()
    val prefs = profile?.preferences

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0)
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
                text = stringResource(R.string.settings_title),
                style = MaterialTheme.typography.titleLarge,
                color = FitSenseColors.OnSurface,
                fontWeight = FontWeight.SemiBold,
            )
        }

        SettingsSection(label = stringResource(R.string.settings_account)) {
            Text(
                text = profile?.displayName ?: profile?.email ?: stringResource(R.string.home_guest),
                style = MaterialTheme.typography.titleMedium,
                color = FitSenseColors.OnSurface,
            )
            Text(
                text = if (profile?.isAnonymous == true) "Anonymous session" else (profile?.email ?: ""),
                style = MaterialTheme.typography.bodyMedium,
                color = FitSenseColors.OnSurfaceMuted,
            )
        }

        SettingsSection(label = stringResource(R.string.settings_units)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OptionChip(
                    selected = prefs?.units == MeasurementUnit.MILLIMETRES,
                    label = stringResource(R.string.settings_units_mm),
                    onClick = { viewModel.setUnits(MeasurementUnit.MILLIMETRES) },
                )
                OptionChip(
                    selected = prefs?.units == MeasurementUnit.INCHES,
                    label = stringResource(R.string.settings_units_in),
                    onClick = { viewModel.setUnits(MeasurementUnit.INCHES) },
                )
            }
        }

        SettingsSection(label = stringResource(R.string.settings_calibration)) {
            CalibrationReference.entries.forEach { ref ->
                OptionChip(
                    selected = prefs?.defaultCalibration == ref,
                    label = ref.displayName,
                    onClick = { viewModel.setCalibration(ref) },
                )
            }
        }

        SettingsSection(label = stringResource(R.string.settings_analytics)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = stringResource(R.string.settings_analytics),
                    style = MaterialTheme.typography.bodyLarge,
                    color = FitSenseColors.OnSurface,
                    modifier = Modifier.weight(1f),
                )
                Switch(
                    checked = prefs?.analyticsOptIn == true,
                    onCheckedChange = { viewModel.setAnalyticsOptIn(it) },
                )
            }
        }

        val sync by viewModel.syncStatus.collectAsState()
        SettingsSection(label = "Cloud sync") {
            Text(
                text = if (sync.apiConfigured) {
                    if (sync.authenticated) {
                        "API connected · pending ${sync.pendingOps} · failed ${sync.failedOps}"
                    } else {
                        "API configured — tap to authenticate"
                    }
                } else {
                    "Set fitsense.api.baseUrl in local.properties"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = FitSenseColors.OnSurfaceMuted,
            )
            sync.lastError?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Sync scans to FitSense cloud",
                    style = MaterialTheme.typography.bodyLarge,
                    color = FitSenseColors.OnSurface,
                    modifier = Modifier.weight(1f),
                )
                Switch(
                    checked = prefs?.cloudSyncOptIn == true,
                    onCheckedChange = { viewModel.setCloudSyncOptIn(it) },
                )
            }
            OutlinedButton(onClick = { viewModel.refreshSyncStatus() }) {
                Text("Refresh auth status")
            }
            OutlinedButton(onClick = { viewModel.retryPendingSync() }) {
                Text("Retry pending sync")
            }
            OutlinedButton(onClick = { viewModel.pullFromCloud() }) {
                Text("Pull & merge from cloud")
            }
            OutlinedButton(onClick = { viewModel.exportCloudData() }) {
                Text("Export cloud data")
            }
            OutlinedButton(onClick = { viewModel.eraseCloudData() }) {
                Text("Erase cloud data")
            }
            val export by viewModel.exportPreview.collectAsState()
            export?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = FitSenseColors.OnSurfaceMuted,
                )
            }
        }

        SettingsSection(label = "Accuracy study ground truth") {
            Text(
                text = "Optional Brannock / known-foot mm used when accepting scans.",
                style = MaterialTheme.typography.bodySmall,
                color = FitSenseColors.OnSurfaceMuted,
            )
            OutlinedButton(
                onClick = {
                    viewModel.setGroundTruth(
                        lengthMm = prefs?.groundTruthLengthMm ?: 265.0,
                        widthMm = prefs?.groundTruthWidthMm ?: 100.0,
                        notes = prefs?.accuracyStudyNotes ?: "pilot",
                    )
                },
            ) {
                Text(
                    text = "GT L=${prefs?.groundTruthLengthMm ?: "—"} W=${prefs?.groundTruthWidthMm ?: "—"} (tap to set defaults)",
                )
            }
        }

        val status by viewModel.statusMessage.collectAsState()
        status?.let {
            Text(text = it, style = MaterialTheme.typography.bodySmall, color = FitSenseColors.Neon)
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))

        OutlinedButton(
            onClick = { viewModel.signOut(onBack) },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.settings_sign_out))
        }
        Text(
            text = stringResource(R.string.settings_version, com.fitsense.ai.BuildConfig.VERSION_NAME),
            style = MaterialTheme.typography.bodySmall,
            color = FitSenseColors.OnSurfaceMuted,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

@Composable
private fun SettingsSection(label: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = FitSenseColors.OnSurfaceMuted,
        )
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                content()
            }
        }
    }
}

@Composable
private fun OptionChip(selected: Boolean, label: String, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(50),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) FitSenseColors.Neon else FitSenseColors.Surface3,
        ),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) FitSenseColors.Surface0 else FitSenseColors.OnSurface,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
        )
    }
}
