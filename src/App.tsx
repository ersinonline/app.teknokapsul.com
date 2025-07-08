import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import { FinancialAnalytics } from './components/analytics/FinancialAnalytics';
import { MobileNavigation } from './components/navigation/MobileNavigation';

import { IncomePage } from './pages/income/IncomePage';
import { ExpensePage } from './pages/expense/ExpensePage';
import { FinancialDataPage } from './pages/financial/FinancialDataPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <AppLayout>
      <MobileNavigation />
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
    path: '/',
    element: <Navigate to="/dashboard" replace />
  }
]);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FamilyProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <RouterProvider router={router} />
          </div>
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;