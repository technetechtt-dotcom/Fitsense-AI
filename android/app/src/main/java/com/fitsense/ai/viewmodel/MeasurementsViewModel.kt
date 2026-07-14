package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MeasurementsViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository,
) : ViewModel() {

    @OptIn(ExperimentalCoroutinesApi::class)
    val scans: StateFlow<List<ScanResult>> = userRepository.profile
        .flatMapLatest { scanRepository.observeScans(it?.userId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun delete(scanId: String) {
        viewModelScope.launch {
            val user = userRepository.profile.firstOrNull() ?: return@launch
            scanRepository.deleteScan(user.userId, scanId)
        }
    }
}
