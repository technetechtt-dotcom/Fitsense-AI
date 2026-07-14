package com.fitsense.ai.ui.screens.splash

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.fitsense.ai.R
import com.fitsense.ai.ui.theme.FitSenseColors
import kotlinx.coroutines.delay

/**
 * In-app animated splash.  The system splash (handled by androidx.core.splashscreen)
 * fires first; this is a smooth follow-up that holds for ~900ms before the
 * navigation graph routes onward.
 */
@Composable
fun SplashScreen(onDone: () -> Unit) {
    var animateIn by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (animateIn) 1f else 0.85f,
        animationSpec = tween(durationMillis = 480),
        label = "splash-scale",
    )
    val alpha by animateFloatAsState(
        targetValue = if (animateIn) 1f else 0f,
        animationSpec = tween(durationMillis = 360),
        label = "splash-alpha",
    )

    LaunchedEffect(Unit) {
        animateIn = true
        delay(900)
        onDone()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitSenseColors.Surface0),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_launcher_foreground),
                contentDescription = stringResource(id = R.string.app_name),
                modifier = Modifier
                    .size(160.dp)
                    .scale(scale)
                    .alpha(alpha),
            )
            Text(
                text = stringResource(id = R.string.app_name).uppercase(),
                style = MaterialTheme.typography.headlineMedium,
                color = FitSenseColors.OnSurface,
                modifier = Modifier
                    .padding(top = 8.dp)
                    .alpha(alpha),
            )
            Text(
                text = stringResource(id = R.string.splash_loading),
                style = MaterialTheme.typography.bodyMedium,
                color = FitSenseColors.OnSurfaceMuted,
                modifier = Modifier.alpha(alpha),
            )
        }
    }
}
