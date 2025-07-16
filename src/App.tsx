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
import { NotificationsPage } from './pages/notifications/NotificationsPage';
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
import CreditScorePage from './pages/financial/CreditScorePage';
import { WarrantyTrackingPage } from './pages/warranty/WarrantyTrackingPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { MobileFinancePage } from './pages/mobile/MobileFinancePage';
import { TeknokapsulPage } from './pages/mobile/TeknokapsulPage';
import LoanCalculator from './pages/other/LoanCalculator';

import { ShopRewardsPage } from './pages/other/ShopRewardsPage';
import MyOrdersPage from './pages/other/MyOrdersPage';

import EarnAsYouSpendPage from './pages/other/EarnAsYouSpendPage';
import CheckoutPage from './pages/other/CheckoutPage';
import OrderSuccessPage from './pages/other/OrderSuccessPage';
import { GoalsPage } from './pages/goals/GoalsPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import PremiumIntroPage from './pages/PremiumIntroPage';
import PremiumManagePage from './pages/PremiumManagePage';
import AdminPremiumPage from './pages/AdminPremiumPage';
import PremiumSuccessPage from './pages/PremiumSuccessPage';
import PremiumCancelPage from './pages/PremiumCancelPage';
import { PremiumProvider } from './contexts/PremiumContext';

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
    path: '/notifications',
    element: <ProtectedRoute><NotificationsPage /></ProtectedRoute>
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
    path: '/credit-score',
    element: <ProtectedRoute><CreditScorePage /></ProtectedRoute>
  },
  {
    path: '/warranty-tracking',
    element: <ProtectedRoute><WarrantyTrackingPage /></ProtectedRoute>
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
    path: '/teknokapsul',
    element: <ProtectedRoute><TeknokapsulPage /></ProtectedRoute>
  },
  {
    path: '/loan-calculator',
    element: <ProtectedRoute><LoanCalculator /></ProtectedRoute>
  },

  {
    path: '/shop-rewards',
    element: <ProtectedRoute><ShopRewardsPage /></ProtectedRoute>
  },

  {
    path: '/other/earn-as-you-spend',
    element: <ProtectedRoute><EarnAsYouSpendPage /></ProtectedRoute>
  },
  {
    path: '/other/shop-rewards',
    element: <ProtectedRoute><ShopRewardsPage /></ProtectedRoute>
  },
  {
    path: '/other/checkout',
    element: <ProtectedRoute><CheckoutPage /></ProtectedRoute>
  },
  {
    path: '/other/order-success',
    element: <ProtectedRoute><OrderSuccessPage /></ProtectedRoute>
  },
  {
    path: '/other/my-orders',
    element: <ProtectedRoute><MyOrdersPage /></ProtectedRoute>
  },
  {
    path: '/goals',
    element: <ProtectedRoute><GoalsPage /></ProtectedRoute>
  },
  {
    path: '/budget',
    element: <ProtectedRoute><BudgetPage /></ProtectedRoute>
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
    path: '/premium',
    element: <ProtectedRoute><PremiumIntroPage /></ProtectedRoute>
  },
  {
    path: '/premium/manage',
    element: <ProtectedRoute><PremiumManagePage /></ProtectedRoute>
  },
  {
    path: '/premium/success',
    element: <ProtectedRoute><PremiumSuccessPage /></ProtectedRoute>
  },
  {
    path: '/premium/cancel',
    element: <ProtectedRoute><PremiumCancelPage /></ProtectedRoute>
  },
  {
    path: '/admin/premium',
    element: <ProtectedRoute><AdminPremiumPage /></ProtectedRoute>
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
        <PremiumProvider>
          <div className="min-h-screen bg-gray-50 transition-colors duration-300">
            <RouterProvider router={router} />
          </div>
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;