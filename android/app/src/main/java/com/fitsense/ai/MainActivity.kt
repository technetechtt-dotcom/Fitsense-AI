package com.fitsense.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import com.fitsense.ai.ui.navigation.FitSenseNavGraph
import com.fitsense.ai.ui.theme.FitSenseTheme
import com.fitsense.ai.viewmodel.SplashViewModel
import dagger.hilt.android.AndroidEntryPoint

/**
 * Sole [ComponentActivity] hosting the Compose navigation graph.
 *
 * Uses [installSplashScreen] for the animated system splash, then defers control
 * to a [SplashViewModel] that decides which destination the user should land on
 * (onboarding vs home) based on persisted state.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Keep splash visible until first auth + onboarding check completes.
        var keepSplash = true
        splashScreen.setKeepOnScreenCondition { keepSplash }

        setContent {
            FitSenseTheme {
                val viewModel: SplashViewModel = hiltViewModel()
                val startDestination by viewModel.startDestination.collectAsState()

                // Once the VM emits a destination, dismiss the system splash.
                startDestination?.let { dest ->
                    keepSplash = false
                    FitSenseNavGraph(startDestination = dest)
                }
            }
        }
    }
}
