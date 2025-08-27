/**
 * WebView detection and handling utilities
 */

// WebView detection
export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for common WebView indicators
  
  // Check for mobile app WebView
  const isMobileWebView = /Android.*wv|iPhone.*Mobile.*Safari|iPad.*Mobile.*Safari/.test(userAgent);
  
  // Check for specific app WebViews
  const isAppWebView = /TeknoKapsul|ReactNative|Cordova|PhoneGap/.test(userAgent);
  
  // Check window properties that indicate WebView
  const hasWebViewProps = !!(window as any).ReactNativeWebView || 
                         !!(window as any).webkit?.messageHandlers ||
                         !!(window as any).Android;
  
  return isMobileWebView || isAppWebView || hasWebViewProps;
};

// Get WebView type
export const getWebViewType = (): 'ios' | 'android' | 'react-native' | 'unknown' => {
  const userAgent = navigator.userAgent;
  
  if ((window as any).ReactNativeWebView) {
    return 'react-native';
  }
  
  if (/iPhone|iPad/.test(userAgent) && /Mobile.*Safari/.test(userAgent)) {
    return 'ios';
  }
  
  if (/Android.*wv/.test(userAgent)) {
    return 'android';
  }
  
  return 'unknown';
};

// WebView message handling
export const sendMessageToApp = (message: any): void => {
  const webViewType = getWebViewType();
  
  try {
    switch (webViewType) {
      case 'react-native':
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
        }
        break;
        
      case 'ios':
        if ((window as any).webkit?.messageHandlers?.nativeApp) {
          (window as any).webkit.messageHandlers.nativeApp.postMessage(message);
        }
        break;
        
      case 'android':
        if ((window as any).Android) {
          (window as any).Android.postMessage(JSON.stringify(message));
        }
        break;
        
      default:
        console.log('WebView message:', message);
    }
  } catch (error) {
    console.error('Failed to send message to app:', error);
  }
};

// OAuth redirect handling for WebView
export const handleOAuthRedirect = (provider: 'google' | 'apple' | 'facebook'): void => {
  if (isWebView()) {
    // For WebView, we need to handle OAuth differently
    sendMessageToApp({
      type: 'oauth_request',
      provider,
      timestamp: Date.now()
    });
  }
};

// Check if OAuth should be handled natively
export const shouldUseNativeOAuth = (): boolean => {
  return isWebView() && (getWebViewType() === 'ios' || getWebViewType() === 'android');
};

// WebView-safe OAuth configuration
export const getWebViewSafeOAuthConfig = () => {
  const baseConfig = {
    // Disable popup mode in WebView
    mode: 'redirect' as const,
    // Use current window instead of popup
    redirectUrl: window.location.origin + '/auth/callback',
  };
  
  if (isWebView()) {
    return {
      ...baseConfig,
      // Additional WebView-specific settings
      display: 'touch',
      prompt: 'select_account',
    };
  }
  
  return baseConfig;
};