import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyProvider';
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

const ProtectedRoute = ({ element }) => (
  <AuthGuard>
    <AppLayout>{element}</AppLayout>
  </AuthGuard>
);

function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/services" element={<ProtectedRoute element={<Services />} />} />
            <Route path="/payments" element={<ProtectedRoute element={<Payments />} />} />
            <Route path="/subscriptions" element={<ProtectedRoute element={<SubscriptionsPage />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
            <Route path="/notes" element={<ProtectedRoute element={<NotesPage />} />} />
            <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
            <Route path="/faq" element={<ProtectedRoute element={<FAQPage />} />} />
            <Route path="/other" element={<ProtectedRoute element={<OtherPage />} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </FamilyProvider>
    </AuthProvider>
  );
}

export default App;