package com.fitsense.ai.recommendation

import com.fitsense.ai.models.FitType
import com.fitsense.ai.models.Product
import com.fitsense.ai.models.ShoeCategory
import com.fitsense.ai.models.SizeRange
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-app fallback catalog used when Firestore products are empty (fresh installs
 * / offline demos).  In production the catalogue would come from Firestore +
 * partner integrations.
 */
@Singleton
class ShoeCatalog @Inject constructor() {

    fun builtIn(): List<Product> = listOf(
        Product(
            productId = "nike-pegasus-41",
            brand = "Nike",
            model = "Pegasus 41",
            category = ShoeCategory.RUNNING,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 48.0, 0.5),
            priceUsd = 140.0,
            description = "Daily trainer with React + Air Zoom cushioning.",
            colorways = listOf("Black/White", "Volt", "Blueprint"),
        ),
        Product(
            productId = "nike-airmax-90",
            brand = "Nike",
            model = "Air Max 90",
            category = ShoeCategory.SNEAKER,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 47.0, 0.5),
            priceUsd = 130.0,
            description = "Icon. Visible Air heel unit.",
            colorways = listOf("Infrared", "Triple White", "Wolf Grey"),
        ),
        Product(
            productId = "adidas-ultraboost-light",
            brand = "Adidas",
            model = "Ultraboost Light",
            category = ShoeCategory.RUNNING,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 49.0, 0.5),
            priceUsd = 190.0,
            description = "BOOST Light midsole, Primeknit upper.",
            colorways = listOf("Core Black", "Cloud White", "Solar Red"),
        ),
        Product(
            productId = "adidas-samba-og",
            brand = "Adidas",
            model = "Samba OG",
            category = ShoeCategory.CASUAL,
            fitType = FitType.NARROW,
            sizeRangeEu = SizeRange(36.0, 47.0, 1.0),
            priceUsd = 100.0,
            description = "Low-profile leather classic.",
            colorways = listOf("White/Black", "Brown Gum", "Navy"),
        ),
        Product(
            productId = "puma-velocity-nitro-3",
            brand = "Puma",
            model = "Velocity Nitro 3",
            category = ShoeCategory.RUNNING,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 48.0, 0.5),
            priceUsd = 110.0,
            description = "Nitro foam tempo trainer.",
            colorways = listOf("Black Lime", "White Coral"),
        ),
        Product(
            productId = "puma-suede-classic",
            brand = "Puma",
            model = "Suede Classic",
            category = ShoeCategory.CASUAL,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 47.0, 1.0),
            priceUsd = 80.0,
            description = "Lifestyle silhouette since 1968.",
            colorways = listOf("Red", "Black", "Navy"),
        ),
        Product(
            productId = "newbalance-1080-v13",
            brand = "New Balance",
            model = "Fresh Foam X 1080 v13",
            category = ShoeCategory.RUNNING,
            fitType = FitType.WIDE,
            sizeRangeEu = SizeRange(38.0, 49.0, 0.5),
            priceUsd = 165.0,
            description = "Plush daily trainer, wide-foot friendly.",
            colorways = listOf("Black", "White Silver"),
        ),
        Product(
            productId = "bata-power-classic",
            brand = "Bata Power",
            model = "Classic Trainer",
            category = ShoeCategory.SNEAKER,
            fitType = FitType.STANDARD,
            sizeRangeEu = SizeRange(36.0, 46.0, 1.0),
            priceUsd = 35.0,
            description = "Affordable everyday trainer (local retail).",
            colorways = listOf("White", "Black"),
        ),
        Product(
            productId = "north-star-runlite",
            brand = "North Star",
            model = "RunLite",
            category = ShoeCategory.RUNNING,
            fitType = FitType.WIDE,
            sizeRangeEu = SizeRange(38.0, 46.0, 1.0),
            priceUsd = 45.0,
            description = "Light, wide-fit local running shoe.",
            colorways = listOf("Charcoal", "Cobalt"),
        ),
    )
}
