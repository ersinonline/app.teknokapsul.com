import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

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
  } catch (error) {
    console.error('Error rendering app:', error);
    // Fallback UI in case of an error
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif;">An error occurred while loading the application. Please try again later.</div>';
  }
};

renderApp();