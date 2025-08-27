import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { trTR } from '@clerk/localizations';
import App from './App';
import './index.css';

// Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsudGVrbm9rYXBzdWwuaW5mbyQ';

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
            layout: {
              socialButtonsVariant: 'blockButton',
              logoImageUrl: undefined,
              showOptionalFields: false
            },
            elements: {
              rootBox: 'w-full',
              card: 'w-full max-w-md mx-auto',
              socialButtonsBlockButton: 'w-full py-3 text-sm md:text-base',
              formButtonPrimary: 'w-full py-3 text-sm md:text-base',
              formFieldInput: 'w-full py-3 px-4 text-sm md:text-base'
            }
          }}
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