package com.fitsense.ai.di

import com.fitsense.ai.repository.ProductRepository
import com.fitsense.ai.repository.ProductRepositoryImpl
import com.fitsense.ai.repository.ScanRepository
import com.fitsense.ai.repository.ScanRepositoryImpl
import com.fitsense.ai.repository.UserRepository
import com.fitsense.ai.repository.UserRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Maps repository interfaces (ports) → Firebase-backed implementations (adapters).
 *
 * Using `@Binds` keeps the call sites depending only on the abstractions, which
 * makes it trivial to swap in fakes for ViewModel unit tests.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository

    @Binds @Singleton
    abstract fun bindProductRepository(impl: ProductRepositoryImpl): ProductRepository
}
