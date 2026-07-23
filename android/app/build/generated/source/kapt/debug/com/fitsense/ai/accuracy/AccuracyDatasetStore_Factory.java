package com.fitsense.ai.accuracy;

import android.content.Context;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class AccuracyDatasetStore_Factory implements Factory<AccuracyDatasetStore> {
  private final Provider<Context> contextProvider;

  public AccuracyDatasetStore_Factory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public AccuracyDatasetStore get() {
    return newInstance(contextProvider.get());
  }

  public static AccuracyDatasetStore_Factory create(Provider<Context> contextProvider) {
    return new AccuracyDatasetStore_Factory(contextProvider);
  }

  public static AccuracyDatasetStore newInstance(Context context) {
    return new AccuracyDatasetStore(context);
  }
}
