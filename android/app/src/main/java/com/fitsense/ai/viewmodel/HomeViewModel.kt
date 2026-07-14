package com.fitsense.ai.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitsense.ai.models.ScanResult
import com.fitsense.ai.models.UserProfile
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository,
) : ViewModel() {

    val profile: StateFlow<UserProfile?> = userRepository.profile.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = null,
    )

    @OptIn(ExperimentalCoroutinesApi::class)
    val recentScans: StateFlow<List<ScanResult>> = userRepository.profile
        .flatMapLatest { user -> scanRepository.observeScans(user?.userId) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList(),
        )

    init {
        // Trigger anon sign-in if it didn't happen already (e.g. cold launch).
        viewModelScope.launch { userRepository.ensureSignedIn() }
    }
}
