import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Initialize Sentry only in production
if (import.meta.env.PROD) {
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
}

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

// Load Google Maps API dynamically
const loadGoogleMapsAPI = () => {
  // Check if Google Maps is already loaded
  if (window.google && window.google.maps) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBHKWvqJtUPiPOy8RSM2rZoNKsKdVrNb-A';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr&region=TR&loading=async`;
  
  script.onerror = () => {
    console.error('Failed to load Google Maps API');
  };
  
  document.head.appendChild(script);
};

// Error boundary for better error handling
const renderApp = () => {
  try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Failed to find the root element');

    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    // Register service worker after app is rendered
    registerServiceWorker();
    
    // Load Google Maps API
    loadGoogleMapsAPI();
  } catch (error) {
    console.error('Error rendering app:', error);
    // Fallback UI in case of an error
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif;">An error occurred while loading the application. Please try again later.</div>';
  }
};

renderApp();