package com.fitsense.ai.di;

import com.fitsense.ai.repository.ProductRepository;
import com.fitsense.ai.repository.ProductRepositoryImpl;
import com.fitsense.ai.repository.ScanRepository;
import com.fitsense.ai.repository.ScanRepositoryImpl;
import com.fitsense.ai.repository.UserRepository;
import com.fitsense.ai.repository.UserRepositoryImpl;
import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;
import javax.inject.Singleton;

/**
 * Maps repository interfaces (ports) → local persistence implementations.
 *
 * Using `@Binds` keeps the call sites depending only on the abstractions, which
 * makes it trivial to swap in fakes for ViewModel unit tests.
 */
@dagger.Module()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b\'\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0010\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006H\'J\u0010\u0010\u0007\u001a\u00020\b2\u0006\u0010\u0005\u001a\u00020\tH\'J\u0010\u0010\n\u001a\u00020\u000b2\u0006\u0010\u0005\u001a\u00020\fH\'\u00a8\u0006\r"}, d2 = {"Lcom/fitsense/ai/di/RepositoryModule;", "", "()V", "bindProductRepository", "Lcom/fitsense/ai/repository/ProductRepository;", "impl", "Lcom/fitsense/ai/repository/ProductRepositoryImpl;", "bindScanRepository", "Lcom/fitsense/ai/repository/ScanRepository;", "Lcom/fitsense/ai/repository/ScanRepositoryImpl;", "bindUserRepository", "Lcom/fitsense/ai/repository/UserRepository;", "Lcom/fitsense/ai/repository/UserRepositoryImpl;", "app_debug"})
@dagger.hilt.InstallIn(value = {dagger.hilt.components.SingletonComponent.class})
public abstract class RepositoryModule {
    
    public RepositoryModule() {
        super();
    }
    
    @dagger.Binds()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public abstract com.fitsense.ai.repository.UserRepository bindUserRepository(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.UserRepositoryImpl impl);
    
    @dagger.Binds()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public abstract com.fitsense.ai.repository.ScanRepository bindScanRepository(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ScanRepositoryImpl impl);
    
    @dagger.Binds()
    @javax.inject.Singleton()
    @org.jetbrains.annotations.NotNull()
    public abstract com.fitsense.ai.repository.ProductRepository bindProductRepository(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.repository.ProductRepositoryImpl impl);
}