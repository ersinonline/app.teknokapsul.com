import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

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
    const root = document.getElementById('root');
    if (!root) throw new Error('Root element not found');

    createRoot(root).render(
      <StrictMode>
        <App />
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