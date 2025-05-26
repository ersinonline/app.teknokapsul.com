import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/auth/AuthGuard';

// Route components
import { Dashboard } from './components/Dashboard';
import Services from './pages/services/ServicesPage';
import { Payments } from './components/Payments';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotesPage } from './pages/notes/NotesPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { FAQPage } from './pages/faq/FAQPage';
import { OtherPage } from './pages/other/OtherPage';

const ProtectedRoute = ({ children }) => (
  <AuthGuard>
    <AppLayout>{children}</AppLayout>
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
    path: '/payments',
    element: <ProtectedRoute><Payments /></ProtectedRoute>
  },
  {
    path: '/subscriptions',
    element: <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
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
    <AuthProvider>
      <FamilyProvider>
        <RouterProvider router={router} />
      </FamilyProvider>
    </AuthProvider>
  );
}

export default App;