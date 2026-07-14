#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Register the FitSenseAR plugin with the Capacitor bridge. The Swift
// class above is annotated `@objc(FitSenseARPlugin)` so Capacitor can
// instantiate it via NSClassFromString at runtime.
CAP_PLUGIN(FitSenseARPlugin, "FitSenseAR",
           CAP_PLUGIN_METHOD(getCapabilities, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(measureFoot, CAPPluginReturnPromise);
)
