package com.fitsense.ai.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.fitsense.ai.ui.screens.home.HomeScreen
import com.fitsense.ai.ui.screens.measurements.SavedMeasurementsScreen
import com.fitsense.ai.ui.screens.onboarding.OnboardingScreen
import com.fitsense.ai.ui.screens.recommendations.RecommendationsScreen
import com.fitsense.ai.ui.screens.results.ResultsScreen
import com.fitsense.ai.ui.screens.scan.ScanScreen
import com.fitsense.ai.ui.screens.settings.SettingsScreen
import com.fitsense.ai.ui.screens.splash.SplashScreen

/**
 * Top-level navigation graph.  The system splash screen handles the initial
 * boot, so we only mount [SplashScreen] for the in-app animated reveal when
 * deep-linking back through cold-launch.
 */
@Composable
fun FitSenseNavGraph(startDestination: Destinations) {
    val navController = rememberNavController()
    val enter = remember { tween<Float>(durationMillis = 280) }
    val exit = remember { tween<Float>(durationMillis = 220) }

    NavHost(
        navController = navController,
        startDestination = startDestination.route,
        enterTransition = {
            slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(280)) +
                fadeIn(animationSpec = enter)
        },
        exitTransition = {
            slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Start, tween(220)) +
                fadeOut(animationSpec = exit)
        },
        popEnterTransition = {
            slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(220)) +
                fadeIn(animationSpec = enter)
        },
        popExitTransition = {
            slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.End, tween(220)) +
                fadeOut(animationSpec = exit)
        },
    ) {
        composable(Destinations.Splash.route) {
            SplashScreen(onDone = {
                navController.navigate(Destinations.Home.route) {
                    popUpTo(Destinations.Splash.route) { inclusive = true }
                }
            })
        }
        composable(Destinations.Onboarding.route) {
            OnboardingScreen(onFinished = {
                navController.navigate(Destinations.Home.route) {
                    popUpTo(Destinations.Onboarding.route) { inclusive = true }
                }
            })
        }
        composable(Destinations.Home.route) {
            HomeScreen(
                onStartScan = { navController.navigate(Destinations.Scan.route) },
                onOpenMeasurements = { navController.navigate(Destinations.SavedMeasurements.route) },
                onOpenSettings = { navController.navigate(Destinations.Settings.route) },
                onOpenRecommendations = { scanId ->
                    navController.navigate(Destinations.Recommendations.build(scanId))
                },
            )
        }
        composable(Destinations.Scan.route) {
            ScanScreen(
                onCancel = { navController.popBackStack() },
                onScanComplete = { scanId ->
                    navController.navigate(Destinations.Results.build(scanId)) {
                        popUpTo(Destinations.Scan.route) { inclusive = true }
                    }
                },
            )
        }
        composable(
            route = Destinations.Results.route,
            arguments = listOf(navArgument("scanId") { type = NavType.StringType }),
        ) { backStack ->
            val scanId = backStack.arguments?.getString("scanId").orEmpty()
            ResultsScreen(
                scanId = scanId,
                onBack = { navController.popBackStack() },
                onSeeShoes = { sid -> navController.navigate(Destinations.Recommendations.build(sid)) },
                onRescan = {
                    navController.navigate(Destinations.Scan.route) {
                        popUpTo(Destinations.Home.route)
                    }
                },
            )
        }
        composable(
            route = Destinations.Recommendations.route,
            arguments = listOf(navArgument("scanId") { type = NavType.StringType }),
        ) { backStack ->
            val scanId = backStack.arguments?.getString("scanId").orEmpty()
            RecommendationsScreen(
                scanId = scanId,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Destinations.SavedMeasurements.route) {
            SavedMeasurementsScreen(
                onBack = { navController.popBackStack() },
                onOpenScan = { scanId ->
                    navController.navigate(Destinations.Results.build(scanId))
                },
            )
        }
        composable(Destinations.Settings.route) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
