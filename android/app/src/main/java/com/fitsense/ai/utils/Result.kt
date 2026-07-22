package com.fitsense.ai.utils

/**
 * A domain-flavoured [kotlin.Result] alternative that surfaces typed error
 * codes without throwing across coroutine boundaries.
 */
sealed class DataResult<out T> {
    data class Success<T>(val value: T) : DataResult<T>()
    data class Failure(val error: AppError) : DataResult<Nothing>()

    inline fun <R> map(transform: (T) -> R): DataResult<R> = when (this) {
        is Success -> Success(transform(value))
        is Failure -> this
    }

    inline fun onSuccess(action: (T) -> Unit): DataResult<T> = also {
        if (this is Success) action(value)
    }

    inline fun onFailure(action: (AppError) -> Unit): DataResult<T> = also {
        if (this is Failure) action(error)
    }

    fun getOrNull(): T? = (this as? Success)?.value
}

/** Typed app-level failures. */
sealed class AppError(open val message: String, open val cause: Throwable? = null) {
    data class Network(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
    data class Auth(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
    data class Vision(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
    data class AR(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
    data class Storage(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
    data class Unknown(override val message: String, override val cause: Throwable? = null) : AppError(message, cause)
}

inline fun <T> safeCall(
    errorFactory: (Throwable) -> AppError = { AppError.Unknown(it.message ?: "Unknown", it) },
    block: () -> T,
): DataResult<T> = try {
    DataResult.Success(block())
} catch (t: Throwable) {
    DataResult.Failure(errorFactory(t))
}
