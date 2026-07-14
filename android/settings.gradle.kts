/*
 * FitSense AI - Settings (Gradle Kotlin DSL).
 *
 * Configures plugin & dependency resolution for the FitSense AI Android project.
 * Uses centralized version catalog (gradle/libs.versions.toml).
 */

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}

rootProject.name = "FitSenseAI"
include(":app")
