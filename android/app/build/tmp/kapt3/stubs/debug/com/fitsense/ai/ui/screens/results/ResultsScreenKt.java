package com.fitsense.ai.ui.screens.results;

import androidx.compose.foundation.layout.Arrangement;
import androidx.compose.material.icons.Icons;
import androidx.compose.runtime.Composable;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.font.FontWeight;
import com.fitsense.ai.R;
import com.fitsense.ai.models.ScanResult;
import com.fitsense.ai.models.UiState;
import com.fitsense.ai.models.UserPreferences;
import com.fitsense.ai.ui.theme.FitSenseColors;
import com.fitsense.ai.viewmodel.ResultsViewModel;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000,\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\u001aB\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0003\u001aJ\u0010\n\u001a\u00020\u00012\u0006\u0010\u000b\u001a\u00020\f2\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\u0012\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\f\u0012\u0004\u0012\u00020\u00010\r2\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\b\b\u0002\u0010\u000e\u001a\u00020\u000fH\u0007\u00a8\u0006\u0010"}, d2 = {"ResultsContent", "", "scan", "Lcom/fitsense/ai/models/ScanResult;", "prefs", "Lcom/fitsense/ai/models/UserPreferences;", "onBack", "Lkotlin/Function0;", "onSeeShoes", "onRescan", "ResultsScreen", "scanId", "", "Lkotlin/Function1;", "viewModel", "Lcom/fitsense/ai/viewmodel/ResultsViewModel;", "app_debug"})
public final class ResultsScreenKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ResultsScreen(@org.jetbrains.annotations.NotNull()
    java.lang.String scanId, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onBack, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onSeeShoes, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onRescan, @org.jetbrains.annotations.NotNull()
    com.fitsense.ai.viewmodel.ResultsViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    private static final void ResultsContent(com.fitsense.ai.models.ScanResult scan, com.fitsense.ai.models.UserPreferences prefs, kotlin.jvm.functions.Function0<kotlin.Unit> onBack, kotlin.jvm.functions.Function0<kotlin.Unit> onSeeShoes, kotlin.jvm.functions.Function0<kotlin.Unit> onRescan) {
    }
}