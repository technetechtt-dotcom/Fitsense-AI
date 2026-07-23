package com.fitsense.ai.ui.screens.home;

import androidx.compose.foundation.layout.Arrangement;
import androidx.compose.material.icons.Icons;
import androidx.compose.material3.CardDefaults;
import androidx.compose.runtime.Composable;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.Brush;
import androidx.compose.ui.graphics.vector.ImageVector;
import androidx.compose.ui.text.font.FontWeight;
import com.fitsense.ai.R;
import com.fitsense.ai.ui.theme.FitSenseColors;
import com.fitsense.ai.viewmodel.HomeViewModel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000<\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0005\u001a\u0016\u0010\u0000\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00010\u0003H\u0003\u001a\u0016\u0010\u0004\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00010\u0003H\u0003\u001a\u0010\u0010\u0005\u001a\u00020\u00012\u0006\u0010\u0006\u001a\u00020\u0007H\u0003\u001a_\u0010\b\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\f\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032!\u0010\u000b\u001a\u001d\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\r\u0012\b\b\u0006\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u00010\f2\b\b\u0002\u0010\u000f\u001a\u00020\u0010H\u0007\u001a0\u0010\u0011\u001a\u00020\u00012\u0006\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u00072\f\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\b\b\u0002\u0010\u0016\u001a\u00020\u0017H\u0003\u001a2\u0010\u0018\u001a\u00020\u00012\f\u0010\u0019\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\f\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u00010\u00032\f\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00010\u0003H\u0003\u00a8\u0006\u001c"}, d2 = {"EmptyRecentScansHint", "", "onStartScan", "Lkotlin/Function0;", "HeroCard", "HomeHeader", "name", "", "HomeScreen", "onOpenMeasurements", "onOpenSettings", "onOpenRecommendations", "Lkotlin/Function1;", "Lkotlin/ParameterName;", "scanId", "viewModel", "Lcom/fitsense/ai/viewmodel/HomeViewModel;", "QuickAction", "icon", "Landroidx/compose/ui/graphics/vector/ImageVector;", "label", "onClick", "modifier", "Landroidx/compose/ui/Modifier;", "QuickActionsGrid", "onMeasurements", "onSettings", "onRecommendations", "app_debug"})
public final class HomeScreenKt {
    
    @androidx.compose.runtime.Composable()
    public static final void HomeScreen(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onStartScan, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onOpenMeasurements, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onOpenSettings, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onOpenRecommendations, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.HomeViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void HomeHeader(java.lang.String name) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void HeroCard(kotlin.jvm.functions.Function0<kotlin.Unit> onStartScan) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void QuickActionsGrid(kotlin.jvm.functions.Function0<kotlin.Unit> onMeasurements, kotlin.jvm.functions.Function0<kotlin.Unit> onSettings, kotlin.jvm.functions.Function0<kotlin.Unit> onRecommendations) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void QuickAction(androidx.compose.ui.graphics.vector.ImageVector icon, java.lang.String label, kotlin.jvm.functions.Function0<kotlin.Unit> onClick, androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void EmptyRecentScansHint(kotlin.jvm.functions.Function0<kotlin.Unit> onStartScan) {
    }
}