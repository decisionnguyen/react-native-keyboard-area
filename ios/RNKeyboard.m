#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(RNKeyboard, RCTEventEmitter)

RCT_EXTERN_METHOD(startKeyboardListener:(RCTResponseSenderBlock)successCallback)

RCT_EXTERN_METHOD(stopKeyboardListener)

@end
