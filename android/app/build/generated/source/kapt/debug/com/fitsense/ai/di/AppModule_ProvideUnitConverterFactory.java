package com.fitsense.ai.di;

import com.fitsense.ai.measurement.UnitConverter;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
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
public final class AppModule_ProvideUnitConverterFactory implements Factory<UnitConverter> {
  @Override
  public UnitConverter get() {
    return provideUnitConverter();
  }

  public static AppModule_ProvideUnitConverterFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static UnitConverter provideUnitConverter() {
    return Preconditions.checkNotNullFromProvides(AppModule.INSTANCE.provideUnitConverter());
  }

  private static final class InstanceHolder {
    private static final AppModule_ProvideUnitConverterFactory INSTANCE = new AppModule_ProvideUnitConverterFactory();
  }
}
