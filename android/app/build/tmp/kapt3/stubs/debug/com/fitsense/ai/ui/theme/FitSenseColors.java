package com.fitsense.ai.ui.theme;

import androidx.compose.ui.graphics.Brush;

/**
 * FitSense AI brand palette.
 *
 * Dark theme is treated as the primary aesthetic (sneaker-tech, near-black
 * surfaces with neon accents); the light theme is a tuned counterpart for
 * accessibility / daylight readability.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b!\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u0019\u0010\u0003\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0005\u0010\u0006R\u0011\u0010\b\u001a\u00020\t8F\u00a2\u0006\u0006\u001a\u0004\b\n\u0010\u000bR\u0019\u0010\f\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\r\u0010\u0006R\u0019\u0010\u000e\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u000f\u0010\u0006R\u0019\u0010\u0010\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0011\u0010\u0006R\u0019\u0010\u0012\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0013\u0010\u0006R\u0019\u0010\u0014\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0015\u0010\u0006R\u0019\u0010\u0016\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0017\u0010\u0006R\u0011\u0010\u0018\u001a\u00020\t8F\u00a2\u0006\u0006\u001a\u0004\b\u0019\u0010\u000bR\u0019\u0010\u001a\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u001b\u0010\u0006R\u0019\u0010\u001c\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u001d\u0010\u0006R\u0019\u0010\u001e\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u001f\u0010\u0006R\u0019\u0010 \u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b!\u0010\u0006R\u0019\u0010\"\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b#\u0010\u0006R\u0019\u0010$\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b%\u0010\u0006R\u0019\u0010&\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\'\u0010\u0006R\u0019\u0010(\u001a\u00020\u0004\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b)\u0010\u0006\u0082\u0002\u000b\n\u0005\b\u00a1\u001e0\u0001\n\u0002\b!\u00a8\u0006*"}, d2 = {"Lcom/fitsense/ai/ui/theme/FitSenseColors;", "", "()V", "Coral", "Landroidx/compose/ui/graphics/Color;", "getCoral-0d7_KjU", "()J", "J", "HeroGradient", "Landroidx/compose/ui/graphics/Brush;", "getHeroGradient", "()Landroidx/compose/ui/graphics/Brush;", "Lime", "getLime-0d7_KjU", "Neon", "getNeon-0d7_KjU", "OnSurface", "getOnSurface-0d7_KjU", "OnSurfaceLight", "getOnSurfaceLight-0d7_KjU", "OnSurfaceMuted", "getOnSurfaceMuted-0d7_KjU", "OnSurfaceMutedLight", "getOnSurfaceMutedLight-0d7_KjU", "ScanGradient", "getScanGradient", "Surface0", "getSurface0-0d7_KjU", "Surface0Light", "getSurface0Light-0d7_KjU", "Surface1", "getSurface1-0d7_KjU", "Surface1Light", "getSurface1Light-0d7_KjU", "Surface2", "getSurface2-0d7_KjU", "Surface2Light", "getSurface2Light-0d7_KjU", "Surface3", "getSurface3-0d7_KjU", "Violet", "getViolet-0d7_KjU", "app_debug"})
public final class FitSenseColors {
    private static final long Neon = 0L;
    private static final long Lime = 0L;
    private static final long Violet = 0L;
    private static final long Coral = 0L;
    private static final long Surface0 = 0L;
    private static final long Surface1 = 0L;
    private static final long Surface2 = 0L;
    private static final long Surface3 = 0L;
    private static final long OnSurface = 0L;
    private static final long OnSurfaceMuted = 0L;
    private static final long Surface0Light = 0L;
    private static final long Surface1Light = 0L;
    private static final long Surface2Light = 0L;
    private static final long OnSurfaceLight = 0L;
    private static final long OnSurfaceMutedLight = 0L;
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.ui.theme.FitSenseColors INSTANCE = null;
    
    private FitSenseColors() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.ui.graphics.Brush getScanGradient() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final androidx.compose.ui.graphics.Brush getHeroGradient() {
        return null;
    }
}