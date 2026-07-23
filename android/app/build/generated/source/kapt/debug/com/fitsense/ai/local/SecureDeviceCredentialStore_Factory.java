package com.fitsense.ai.local;

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
public final class SecureDeviceCredentialStore_Factory implements Factory<SecureDeviceCredentialStore> {
  private final Provider<Context> contextProvider;

  public SecureDeviceCredentialStore_Factory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public SecureDeviceCredentialStore get() {
    return newInstance(contextProvider.get());
  }

  public static SecureDeviceCredentialStore_Factory create(Provider<Context> contextProvider) {
    return new SecureDeviceCredentialStore_Factory(contextProvider);
  }

  public static SecureDeviceCredentialStore newInstance(Context context) {
    return new SecureDeviceCredentialStore(context);
  }
}
