package com.fitsense.ai.repository;

import com.fitsense.ai.models.Product;
import com.fitsense.ai.recommendation.ShoeCatalog;
import com.fitsense.ai.utils.DataResult;
import javax.inject.Inject;

/**
 * Loads the product catalogue from the bundled [ShoeCatalog].
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J\u001a\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u0003H\u00a6@\u00a2\u0006\u0002\u0010\u0006\u00a8\u0006\u0007"}, d2 = {"Lcom/fitsense/ai/repository/ProductRepository;", "", "getAllProducts", "Lcom/fitsense/ai/utils/DataResult;", "", "Lcom/fitsense/ai/models/Product;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface ProductRepository {
    
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getAllProducts(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.fitsense.ai.utils.DataResult<? extends java.util.List<com.fitsense.ai.models.Product>>> $completion);
}