package com.fitsense.ai.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.SizeRecommendation
import com.fitsense.ai.models.UiState
import com.fitsense.ai.recommendation.RecommendationEngine
import com.fitsense.ai.repository.ProductRepository
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.utils.DataResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Aggregates [ScanResult] + product catalog → fresh [SizeRecommendation] each
 * time the user opens the recommendations screen.
 */
@HiltViewModel
class RecommendationsViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository,
    private val productRepository: ProductRepository,
    private val recommendationEngine: RecommendationEngine,
) : ViewModel() {

    private val scanId: String = savedStateHandle["scanId"] ?: ""

    private val _state = MutableStateFlow<UiState<SizeRecommendation>>(UiState.Loading)
    val state: StateFlow<UiState<SizeRecommendation>> = _state.asStateFlow()

    init {
        loadRecommendations()
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    private fun loadRecommendations() {
        viewModelScope.launch {
            val productsResult = productRepository.getAllProducts()
            val products = when (productsResult) {
                is DataResult.Success -> productsResult.value
                is DataResult.Failure -> {
                    _state.value = UiState.Error(productsResult.error.message)
                    return@launch
                }
            }

            userRepository.profile
                .flatMapLatest { scanRepository.observeScans(it?.userId) }
                .collect { scans ->
                    val scan = scans.firstOrNull { it.scanId == scanId }
                    val foot = scan?.primaryFoot
                    _state.value = when {
                        scan == null -> UiState.Error("Scan not found.")
                        foot == null -> UiState.Error("Scan has no foot measurement.")
                        else -> UiState.Success(
                            recommendationEngine.recommend(foot, products),
                        )
                    }
                }
        }
    }
}
