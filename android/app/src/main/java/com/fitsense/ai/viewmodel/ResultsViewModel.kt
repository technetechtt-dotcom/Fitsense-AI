package com.fitsense.ai.viewmodel

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.UiState
import com.fitsense.ai.models.UserPreferences
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ResultsViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository,
) : ViewModel() {

    private val scanId: String = savedStateHandle["scanId"] ?: ""

    private val _state = MutableStateFlow<UiState<ScanResult>>(UiState.Loading)
    val state: StateFlow<UiState<ScanResult>> = _state.asStateFlow()

    val preferences: StateFlow<UserPreferences> = userRepository.profile
        .map { it?.preferences ?: UserPreferences() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UserPreferences())

    init {
        observeScan()
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    private fun observeScan() {
        viewModelScope.launch {
            userRepository.profile
                .flatMapLatest { scanRepository.observeScans(it?.userId) }
                .collect { all ->
                    val found = all.firstOrNull { it.scanId == scanId }
                    _state.value = if (found != null) {
                        UiState.Success(found)
                    } else {
                        UiState.Error("Scan not found.")
                    }
                }
        }
    }
}
