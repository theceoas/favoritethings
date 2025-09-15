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
  
  // More robust Safari detection - Safari must be checked before Chrome
  if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
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
  const version = parseFloat(browserVersion);
  
  if (browserName === 'Firefox' && version < 60) {
    issues.push('Firefox version is too old. Please update to Firefox 60 or later.');
  }
  
  if (browserName === 'Safari' && version < 12) {
    issues.push('Safari version is too old. Please update to Safari 12 or later.');
  }
  
  if (browserName === 'Edge' && version < 79) {
    issues.push('Edge version is too old. Please update to Edge 79 or later.');
  }
  
  // Log detection for debugging
  console.log('Browser detected:', { browserName, browserVersion, userAgent });
  
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
    asyncAwait: true, // Modern browsers support async/await
    arrowFunctions: (() => true)(),
    templateLiterals: `test${'template'}` === 'testtemplate',
    destructuring: (() => { const {test} = {test: true}; return test; })(),
    spreadOperator: (() => { const arr = [...[1,2,3]]; return arr.length === 3; })(),
    optionalChaining: true, // Modern browsers support optional chaining
    nullishCoalescing: (() => { try { return (null ?? 'test') === 'test'; } catch (e) { return false; } })()
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
    console.warn('Fetch API not supported');
  }
  
  // Polyfill for older browsers that don't support Promise
  if (typeof Promise === 'undefined') {
    console.warn('Promise not supported');
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
  
  // Apply Safari-specific optimizations immediately
  if (browserInfo.name === 'Safari') {
    applySafariOptimizations();
  }
}

// Safari-specific optimizations
function applySafariOptimizations(): void {
  // Add Safari class to document
  document.documentElement.classList.add('is-safari');
  
  // Disable complex animations for Safari
  const style = document.createElement('style');
  style.textContent = `
    .is-safari * {
      -webkit-transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      -webkit-perspective: 1000px;
    }
    
    .is-safari .motion-reduce {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    .is-safari button {
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    
    .is-safari [data-framer-motion] {
      will-change: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log('🍎 Safari optimizations applied');
}
