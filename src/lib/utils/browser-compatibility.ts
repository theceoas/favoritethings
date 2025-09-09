/**
 * Browser Compatibility Utilities
 * Handles browser-specific issues and provides fallbacks
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  issues: string[];
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const issues: string[] = [];
  
  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = '0';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browserName = 'Internet Explorer';
    issues.push('Internet Explorer is not supported. Please use a modern browser.');
  }
  
  // Check for compatibility issues
  const version = parseInt(browserVersion);
  
  if (browserName === 'Firefox' && version < 60) {
    issues.push('Firefox version is too old. Please update to Firefox 60 or later.');
  }
  
  if (browserName === 'Safari' && version < 12) {
    issues.push('Safari version is too old. Please update to Safari 12 or later.');
  }
  
  if (browserName === 'Edge' && version < 79) {
    issues.push('Edge version is too old. Please update to Edge 79 or later.');
  }
  
  const isSupported = issues.length === 0;
  
  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    issues
  };
}

export function checkFeatureSupport(): { [key: string]: boolean } {
  return {
    fetch: typeof fetch !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    canvas: !!document.createElement('canvas').getContext,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    webGL2: !!document.createElement('canvas').getContext('webgl2'),
    webWorkers: typeof Worker !== 'undefined',
    serviceWorkers: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    geolocation: 'geolocation' in navigator,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    customElements: 'customElements' in window,
    shadowDOM: 'attachShadow' in Element.prototype,
    es6Modules: 'noModule' in HTMLScriptElement.prototype,
    asyncAwait: (async () => {})().then(() => true).catch(() => false),
    arrowFunctions: (() => true)(),
    templateLiterals: `test${'template'}` === 'testtemplate',
    destructuring: (() => { const {test} = {test: true}; return test; })(),
    spreadOperator: (() => { const arr = [...[1,2,3]]; return arr.length === 3; })(),
    optionalChaining: (() => { try { return ({} as any)?.test === undefined; } catch { return false; } })(),
    nullishCoalescing: (() => { try { return (null ?? 'test') === 'test'; } catch { return false; } })()
  };
}

export function showBrowserWarning(browserInfo: BrowserInfo): void {
  if (!browserInfo.isSupported) {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b6b;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    
    warning.innerHTML = `
      <strong>Browser Compatibility Warning:</strong>
      ${browserInfo.issues.join(' ')}
      <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Dismiss</button>
    `;
    
    document.body.appendChild(warning);
  }
}

export function polyfillMissingFeatures(): void {
  // Polyfill for older browsers that don't support fetch
  if (typeof fetch === 'undefined') {
    console.warn('Fetch API not supported, loading polyfill...');
    import('whatwg-fetch').catch(() => {
      console.error('Failed to load fetch polyfill');
    });
  }
  
  // Polyfill for older browsers that don't support Promise
  if (typeof Promise === 'undefined') {
    console.warn('Promise not supported, loading polyfill...');
    import('es6-promise/auto').catch(() => {
      console.error('Failed to load Promise polyfill');
    });
  }
}

export function initializeBrowserCompatibility(): void {
  if (typeof window === 'undefined') return;
  
  const browserInfo = detectBrowser();
  const features = checkFeatureSupport();
  
  console.log('Browser Info:', browserInfo);
  console.log('Feature Support:', features);
  
  // Show warning for unsupported browsers
  showBrowserWarning(browserInfo);
  
  // Polyfill missing features
  polyfillMissingFeatures();
  
  // Store browser info for debugging
  (window as any).__browserInfo = browserInfo;
  (window as any).__featureSupport = features;
}
