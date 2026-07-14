package com.fitsense.ai.ui.screens.recommendations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
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
import com.fitsense.ai.models.UiState
import com.fitsense.ai.ui.components.ErrorState
import com.fitsense.ai.ui.components.LoadingIndicator
import com.fitsense.ai.ui.components.ShoeCard
import com.fitsense.ai.ui.components.StatTile
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.RecommendationsViewModel

@Composable
fun RecommendationsScreen(
    scanId: String,
    onBack: () -> Unit,
    viewModel: RecommendationsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
    ) {
        when (val s = state) {
            UiState.Loading -> LoadingIndicator(text = stringResource(R.string.common_loading))
            is UiState.Error -> ErrorState(message = s.message, onRetry = onBack)
            is UiState.Success -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding()
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 24.dp),
                ) {
                    item {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = onBack) {
                                Icon(
                                    imageVector = Icons.Rounded.ArrowBack,
                                    contentDescription = null,
                                    tint = FitSenseColors.OnSurface,
                                )
                            }
                            Text(
                                text = stringResource(R.string.recommendations_title),
                                style = MaterialTheme.typography.titleLarge,
                                color = FitSenseColors.OnSurface,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatTile(modifier = Modifier.weight(1f), label = "UK", value = s.data.uk)
                            StatTile(modifier = Modifier.weight(1f), label = "US", value = s.data.us)
                            StatTile(modifier = Modifier.weight(1f), label = "EU", value = s.data.eu)
                        }
                    }

                    if (s.data.matches.isEmpty()) {
                        item {
                            Text(
                                text = stringResource(R.string.recommendations_empty),
                                style = MaterialTheme.typography.bodyMedium,
                                color = FitSenseColors.OnSurfaceMuted,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                        }
                    }

                    items(s.data.matches, key = { it.productId }) { match ->
                        ShoeCard(match = match)
                    }
                }
            }
        }
    }
}
