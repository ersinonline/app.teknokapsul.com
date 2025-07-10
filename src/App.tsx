import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { offlineService } from './services/offline.service';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/auth/AuthGuard';

// Route components
import { Dashboard } from './components/Dashboard';
import Services from './pages/services/ServicesPage';

import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotesPage } from './pages/notes/NotesPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { FAQPage } from './pages/faq/FAQPage';
import { OtherPage } from './pages/other/OtherPage';
import { CargoTrackingPage } from './pages/other/CargoTrackingPage';
import { FinancialAnalytics } from './components/analytics/FinancialAnalytics';
import { MobileNavigation } from './components/navigation/MobileNavigation';
import { OfflineIndicator } from './components/offline/OfflineIndicator';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { ServicesListPage } from './pages/applications/ServicesListPage';
import { ApplicationPage } from './pages/applications/ApplicationPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import AdminPage from './pages/admin/AdminPage';

import { IncomePage } from './pages/income/IncomePage';
import { ExpensePage } from './pages/expense/ExpensePage';
import { FinancialDataPage } from './pages/financial/FinancialDataPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { MobileFinancePage } from './pages/mobile/MobileFinancePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <AppLayout>
      <MobileNavigation />
      <OfflineIndicator />
      {children}
    </AppLayout>
  </AuthGuard>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: '/services',
    element: <ProtectedRoute><Services /></ProtectedRoute>
  },

  {
    path: '/subscriptions',
    element: <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
  },
  {
    path: '/analytics',
    element: <ProtectedRoute><FinancialAnalytics /></ProtectedRoute>
  },

  {
    path: '/income',
    element: <ProtectedRoute><IncomePage /></ProtectedRoute>
  },
  {
    path: '/expenses',
    element: <ProtectedRoute><ExpensePage /></ProtectedRoute>
  },
  {
    path: '/financial-data',
    element: <ProtectedRoute><FinancialDataPage /></ProtectedRoute>
  },
  {
    path: '/settings',
    element: <ProtectedRoute><SettingsPage /></ProtectedRoute>
  },
  {
    path: '/notes',
    element: <ProtectedRoute><NotesPage /></ProtectedRoute>
  },
  {
    path: '/calendar',
    element: <ProtectedRoute><CalendarPage /></ProtectedRoute>
  },
  {
    path: '/faq',
    element: <ProtectedRoute><FAQPage /></ProtectedRoute>
  },
  {
    path: '/other',
    element: <ProtectedRoute><OtherPage /></ProtectedRoute>
  },
  {
    path: '/cargo-tracking',
    element: <ProtectedRoute><CargoTrackingPage /></ProtectedRoute>
  },
  {
    path: '/ai-assistant',
    element: <ProtectedRoute><AIAssistantPage /></ProtectedRoute>
  },
  {
    path: '/services-list',
    element: <ProtectedRoute><ServicesListPage /></ProtectedRoute>
  },
  {
    path: '/application/:serviceId',
    element: <ProtectedRoute><ApplicationPage /></ProtectedRoute>
  },
  {
    path: '/application',
    element: <Navigate to="/services-list" replace />
  },
  {
    path: '/financial',
    element: <ProtectedRoute><FinancialDataPage /></ProtectedRoute>
  },

  {
    path: '/portfolio',
    element: <ProtectedRoute><PortfolioPage /></ProtectedRoute>
  },
  {
    path: '/mobile-finance',
    element: <ProtectedRoute><MobileFinancePage /></ProtectedRoute>
  },
  {
          path: '/documents',
          element: <ProtectedRoute><DocumentsPage /></ProtectedRoute>
        },
        {
          path: '/admin',
          element: <ProtectedRoute><AdminPage /></ProtectedRoute>
        },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  }
]);

function App() {
  useEffect(() => {
    // Initialize offline service
    offlineService.init();
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('App is online, syncing data...');
      offlineService.syncOfflineData();
    };
    
    const handleOffline = () => {
      console.log('App is offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 transition-colors duration-300">
          <RouterProvider router={router} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;