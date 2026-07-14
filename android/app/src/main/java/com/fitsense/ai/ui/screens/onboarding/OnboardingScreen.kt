package com.fitsense.ai.ui.screens.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.R
import com.fitsense.ai.ui.components.PrimaryButton
import com.fitsense.ai.ui.theme.FitSenseColors
import com.fitsense.ai.viewmodel.OnboardingViewModel
import kotlinx.coroutines.launch

@Composable
fun OnboardingScreen(
    onFinished: () -> Unit,
    viewModel: OnboardingViewModel = hiltViewModel(),
) {
    val slides = listOf(
        OnboardingSlide(
            title = stringResource(R.string.onboarding_title_1),
            body = stringResource(R.string.onboarding_body_1),
            accent = FitSenseColors.Neon,
        ),
        OnboardingSlide(
            title = stringResource(R.string.onboarding_title_2),
            body = stringResource(R.string.onboarding_body_2),
            accent = FitSenseColors.Violet,
        ),
        OnboardingSlide(
            title = stringResource(R.string.onboarding_title_3),
            body = stringResource(R.string.onboarding_body_3),
            accent = FitSenseColors.Lime,
        ),
    )

    val pagerState = rememberPagerState(pageCount = { slides.size })
    val scope = rememberCoroutineScope()
    val isLast = pagerState.currentPage == slides.lastIndex

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.End,
            ) {
                TextButton(onClick = { viewModel.finishOnboarding(onFinished) }) {
                    Text(stringResource(R.string.onboarding_skip), color = FitSenseColors.OnSurfaceMuted)
                }
            }

            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
            ) { page ->
                OnboardingPage(slide = slides[page])
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                slides.indices.forEach { i ->
                    val selected = i == pagerState.currentPage
                    Box(
                        modifier = Modifier
                            .padding(end = 6.dp)
                            .size(width = if (selected) 28.dp else 8.dp, height = 8.dp)
                            .clip(CircleShape)
                            .background(
                                if (selected) FitSenseColors.Neon
                                else FitSenseColors.Surface3,
                            ),
                    )
                }
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))

                PrimaryButton(
                    text = if (isLast) stringResource(R.string.onboarding_get_started)
                    else stringResource(R.string.onboarding_next),
                    onClick = {
                        if (isLast) {
                            viewModel.finishOnboarding(onFinished)
                        } else {
                            scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                        }
                    },
                )
            }
        }
    }
}

private data class OnboardingSlide(
    val title: String,
    val body: String,
    val accent: androidx.compose.ui.graphics.Color,
)

@Composable
private fun OnboardingPage(slide: OnboardingSlide) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp, Alignment.Bottom),
        horizontalAlignment = Alignment.Start,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp)
                .weight(1f),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(slide.accent.copy(alpha = 0.45f), FitSenseColors.Surface0),
                        ),
                    ),
            )
        }

        Text(
            text = slide.title,
            style = MaterialTheme.typography.displayMedium,
            color = FitSenseColors.OnSurface,
            textAlign = TextAlign.Start,
        )
        Text(
            text = slide.body,
            style = MaterialTheme.typography.bodyLarge,
            color = FitSenseColors.OnSurfaceMuted,
            textAlign = TextAlign.Start,
        )
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(48.dp))
    }
}
