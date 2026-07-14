package com.fitsense.ai.ui.navigation

/**
 * Typed navigation destinations.  Compose Navigation works with strings; this
 * enum keeps the call sites refactor-safe.
 */
enum class Destinations(val route: String) {
    Splash("splash"),
    Onboarding("onboarding"),
    Home("home"),
    Scan("scan"),
    Results("results/{scanId}") {
        override fun build(vararg args: String) = "results/${args[0]}"
    },
    Recommendations("recommendations/{scanId}") {
        override fun build(vararg args: String) = "recommendations/${args[0]}"
    },
    SavedMeasurements("measurements"),
    Settings("settings");

    open fun build(vararg args: String): String = route
}
