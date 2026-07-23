package com.fitsense.ai.monitoring;

import android.util.Log;
import com.fitsense.ai.BuildConfig;
import timber.log.Timber;

/**
 * Lightweight crash / ops reporting. Plants a release Timber tree that
 * always logs locally; optional remote forwarding can be enabled later
 * via a DSN without changing call sites.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001:\u0001\u0005B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u0006\u0010\u0003\u001a\u00020\u0004\u00a8\u0006\u0006"}, d2 = {"Lcom/fitsense/ai/monitoring/CrashReporting;", "", "()V", "install", "", "ReleaseTree", "app_debug"})
public final class CrashReporting {
    @org.jetbrains.annotations.NotNull()
    public static final com.fitsense.ai.monitoring.CrashReporting INSTANCE = null;
    
    private CrashReporting() {
        super();
    }
    
    public final void install() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\u0003\n\u0000\b\u0002\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J,\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\b\u0010\u0007\u001a\u0004\u0018\u00010\b2\u0006\u0010\t\u001a\u00020\b2\b\u0010\n\u001a\u0004\u0018\u00010\u000bH\u0014\u00a8\u0006\f"}, d2 = {"Lcom/fitsense/ai/monitoring/CrashReporting$ReleaseTree;", "Ltimber/log/Timber$Tree;", "()V", "log", "", "priority", "", "tag", "", "message", "t", "", "app_debug"})
    static final class ReleaseTree extends timber.log.Timber.Tree {
        
        public ReleaseTree() {
            super();
        }
        
        @java.lang.Override()
        protected void log(int priority, @org.jetbrains.annotations.Nullable()
        java.lang.String tag, @org.jetbrains.annotations.NotNull()
        java.lang.String message, @org.jetbrains.annotations.Nullable()
        java.lang.Throwable t) {
        }
    }
}