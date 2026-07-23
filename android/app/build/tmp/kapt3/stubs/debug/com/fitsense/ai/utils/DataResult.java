package com.fitsense.ai.utils;

/**
 * A domain-flavoured [kotlin.Result] alternative that surfaces typed error
 * codes without throwing across coroutine boundaries.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0000\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b6\u0018\u0000*\u0006\b\u0000\u0010\u0001 \u00012\u00020\u0002:\u0002\u000f\u0010B\u0007\b\u0004\u00a2\u0006\u0002\u0010\u0003J\r\u0010\u0004\u001a\u0004\u0018\u00018\u0000\u00a2\u0006\u0002\u0010\u0005J,\u0010\u0006\u001a\b\u0012\u0004\u0012\u0002H\u00070\u0000\"\u0004\b\u0001\u0010\u00072\u0012\u0010\b\u001a\u000e\u0012\u0004\u0012\u00028\u0000\u0012\u0004\u0012\u0002H\u00070\tH\u0086\b\u00f8\u0001\u0000J&\u0010\n\u001a\b\u0012\u0004\u0012\u00028\u00000\u00002\u0012\u0010\u000b\u001a\u000e\u0012\u0004\u0012\u00020\f\u0012\u0004\u0012\u00020\r0\tH\u0086\b\u00f8\u0001\u0000J&\u0010\u000e\u001a\b\u0012\u0004\u0012\u00028\u00000\u00002\u0012\u0010\u000b\u001a\u000e\u0012\u0004\u0012\u00028\u0000\u0012\u0004\u0012\u00020\r0\tH\u0086\b\u00f8\u0001\u0000\u0082\u0001\u0002\u0011\u0012\u0082\u0002\u0007\n\u0005\b\u009920\u0001\u00a8\u0006\u0013"}, d2 = {"Lcom/fitsense/ai/utils/DataResult;", "T", "", "()V", "getOrNull", "()Ljava/lang/Object;", "map", "R", "transform", "Lkotlin/Function1;", "onFailure", "action", "Lcom/fitsense/ai/utils/AppError;", "", "onSuccess", "Failure", "Success", "Lcom/fitsense/ai/utils/DataResult$Failure;", "Lcom/fitsense/ai/utils/DataResult$Success;", "app_debug"})
public abstract class DataResult<T extends java.lang.Object> {
    
    private DataResult() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final <R extends java.lang.Object>com.fitsense.ai.utils.DataResult<R> map(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super T, ? extends R> transform) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.utils.DataResult<T> onSuccess(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super T, kotlin.Unit> action) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.fitsense.ai.utils.DataResult<T> onFailure(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.fitsense.ai.utils.AppError, kotlin.Unit> action) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final T getOrNull() {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0010\u0001\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\b\u0012\u0004\u0012\u00020\u00020\u0001B\r\u0012\u0006\u0010\u0003\u001a\u00020\u0004\u00a2\u0006\u0002\u0010\u0005J\t\u0010\b\u001a\u00020\u0004H\u00c6\u0003J\u0013\u0010\t\u001a\u00020\u00002\b\b\u0002\u0010\u0003\u001a\u00020\u0004H\u00c6\u0001J\u0013\u0010\n\u001a\u00020\u000b2\b\u0010\f\u001a\u0004\u0018\u00010\rH\u00d6\u0003J\t\u0010\u000e\u001a\u00020\u000fH\u00d6\u0001J\t\u0010\u0010\u001a\u00020\u0011H\u00d6\u0001R\u0011\u0010\u0003\u001a\u00020\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0006\u0010\u0007\u00a8\u0006\u0012"}, d2 = {"Lcom/fitsense/ai/utils/DataResult$Failure;", "Lcom/fitsense/ai/utils/DataResult;", "", "error", "Lcom/fitsense/ai/utils/AppError;", "(Lcom/fitsense/ai/utils/AppError;)V", "getError", "()Lcom/fitsense/ai/utils/AppError;", "component1", "copy", "equals", "", "other", "", "hashCode", "", "toString", "", "app_debug"})
    public static final class Failure extends com.fitsense.ai.utils.DataResult {
        @org.jetbrains.annotations.NotNull()
        private final com.fitsense.ai.utils.AppError error = null;
        
        public Failure(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.utils.AppError error) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.utils.AppError getError() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.utils.AppError component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.utils.DataResult.Failure copy(@org.jetbrains.annotations.NotNull()
        com.fitsense.ai.utils.AppError error) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u0000*\u0004\b\u0001\u0010\u00012\b\u0012\u0004\u0012\u0002H\u00010\u0002B\r\u0012\u0006\u0010\u0003\u001a\u00028\u0001\u00a2\u0006\u0002\u0010\u0004J\u000e\u0010\b\u001a\u00028\u0001H\u00c6\u0003\u00a2\u0006\u0002\u0010\u0006J\u001e\u0010\t\u001a\b\u0012\u0004\u0012\u00028\u00010\u00002\b\b\u0002\u0010\u0003\u001a\u00028\u0001H\u00c6\u0001\u00a2\u0006\u0002\u0010\nJ\u0013\u0010\u000b\u001a\u00020\f2\b\u0010\r\u001a\u0004\u0018\u00010\u000eH\u00d6\u0003J\t\u0010\u000f\u001a\u00020\u0010H\u00d6\u0001J\t\u0010\u0011\u001a\u00020\u0012H\u00d6\u0001R\u0013\u0010\u0003\u001a\u00028\u0001\u00a2\u0006\n\n\u0002\u0010\u0007\u001a\u0004\b\u0005\u0010\u0006\u00a8\u0006\u0013"}, d2 = {"Lcom/fitsense/ai/utils/DataResult$Success;", "T", "Lcom/fitsense/ai/utils/DataResult;", "value", "(Ljava/lang/Object;)V", "getValue", "()Ljava/lang/Object;", "Ljava/lang/Object;", "component1", "copy", "(Ljava/lang/Object;)Lcom/fitsense/ai/utils/DataResult$Success;", "equals", "", "other", "", "hashCode", "", "toString", "", "app_debug"})
    public static final class Success<T extends java.lang.Object> extends com.fitsense.ai.utils.DataResult<T> {
        private final T value = null;
        
        public Success(T value) {
        }
        
        public final T getValue() {
            return null;
        }
        
        public final T component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.fitsense.ai.utils.DataResult.Success<T> copy(T value) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
}