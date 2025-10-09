import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { trTR } from '@clerk/localizations';
import App from './App';
import './index.css';

// Dynamic Clerk key selection based on environment
const getClerkPublishableKey = (): string => {
  const hostname = window.location.hostname;
  
  // Test keys for localhost and local IPs
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname === '192.168.1.11' ||
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.')) {
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST || 
           import.meta.env.VITE_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST || 
           import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST || 
           'pk_test_Y29udGVudC10ZXJtaXRlLTQ4LmNsZXJrLmFjY291bnRzLmRldiQ';
  }
  
  // Production keys for all other domains
  return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_PROD || 
         import.meta.env.VITE_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD || 
         import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD || 
         'pk_live_Y2xlcmsudGVrbm9rYXBzdWwuaW5mbyQ';
};

const PUBLISHABLE_KEY = getClerkPublishableKey();

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

// Initialize Sentry
Sentry.init({
  dsn: "https://8e4750688773f87de1de590276d818fd@o4509753596248064.ingest.us.sentry.io/4509753604702208",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
});

// Service Worker Registration for PWA support
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('Yeni bir sürüm mevcut. Sayfayı yenilemek ister misiniz?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Error boundary for better error handling
const renderApp = () => {
  try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Failed to find the root element');

    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ClerkProvider 
          publishableKey={PUBLISHABLE_KEY}
          localization={trTR}
          appearance={{
            elements: {
              card: 'w-full max-w-md mx-auto',
              socialButtonsBlockButton: 'w-full py-3 text-sm md:text-base',
              formButtonPrimary: 'w-full py-3 text-sm md:text-base',
              formFieldInput: 'w-full py-3 px-4 text-sm md:text-base',
              // Login formunda "Beni Hatırla" seçeneğini göster
              formFieldAction: 'block',
            },
            variables: {
              // CSS variables for theming
              colorPrimary: '#3b82f6',
            }
          }}
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
          afterSignInUrl="/dashboard"
          afterSignOutUrl="/login"
        >
          <App />
        </ClerkProvider>
      </StrictMode>
    );
    
    // Register service worker after app is rendered
    registerServiceWorker();
  } catch (error) {
    console.error('Error rendering app:', error);
    // Fallback UI in case of an error
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif;">An error occurred while loading the application. Please try again later.</div>';
  }
};

renderApp();