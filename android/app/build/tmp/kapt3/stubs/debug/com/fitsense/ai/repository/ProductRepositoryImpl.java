package com.fitsense.ai.repository;

import com.fitsense.ai.models.Product;
import com.fitsense.ai.recommendation.ShoeCatalog;
import com.fitsense.ai.utils.DataResult;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u001a\u0010\u0005\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u00070\u0006H\u0096@\u00a2\u0006\u0002\u0010\tR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\n"}, d2 = {"Lcom/fitsense/ai/repository/ProductRepositoryImpl;", "Lcom/fitsense/ai/repository/ProductRepository;", "catalog", "Lcom/fitsense/ai/recommendation/ShoeCatalog;", "(Lcom/fitsense/ai/recommendation/ShoeCatalog;)V", "getAllProducts", "Lcom/fitsense/ai/utils/DataResult;", "", "Lcom/fitsense/ai/models/Product;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public final class ProductRepositoryImpl implements com.fitsense.ai.repository.ProductRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.fitsense.ai.recommendation.ShoeCatalog catalog = null;
    
    @javax.inject.Inject()
    public ProductRepositoryImpl(@org.jetbrains.annotations.NotNull()
    com.fitsense.ai.recommendation.ShoeCatalog catalog) {
        super();
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object getAllProducts(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<? extends java.util.List<com.fitsense.ai.models.Product>>> $completion) {
        return null;
    }
}