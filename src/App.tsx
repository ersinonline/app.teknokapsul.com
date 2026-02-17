import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { offlineService } from './services/offline.service';
import { MobileAuthHandler } from './components/auth/MobileAuthHandler';
import { LoginPage } from './pages/auth/LoginPage';

import { AuthGuard } from './components/auth/AuthGuard';

// Route components
import Services from './pages/services/ServicesPage';
import ProfessionalHomePage from './pages/ProfessionalHomePage.tsx';

import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotesPage } from './pages/notes/NotesPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { FAQPage } from './pages/faq/FAQPage';
import { OtherPage } from './pages/other/OtherPage';
import { CargoTrackingPage } from './pages/cargo-tracking/CargoTrackingPage';
import AttendancePage from './pages/attendance/AttendancePage';
import { FinancialAnalytics } from './components/analytics/FinancialAnalytics';
import { MobileNavigation } from './components/navigation/MobileNavigation';
import { OfflineIndicator } from './components/offline/OfflineIndicator';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { ServicesListPage } from './pages/applications/ServicesListPage';
import { ApplicationPage } from './pages/applications/ApplicationPage';
import ApplicationsListPage from './pages/applications/ApplicationsListPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import AdminPage from './pages/admin/AdminPage';
import { AccountsPage } from './pages/Accounts/AccountsPage';
import { AllTransactionsPage } from './pages/AllTransactions/AllTransactionsPage';

import { IncomePage } from './pages/income/IncomePage';
import { ExpensePage } from './pages/expense/ExpensePage';
import { FinancialDataPage } from './pages/financial/FinancialDataPage';
import CreditScorePage from './pages/financial/CreditScorePage';
import { WarrantyTrackingPage } from './pages/warranty/WarrantyTrackingPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import StockMarketPage from './pages/financial/StockMarketPage';

import CreditCalculatorPage2 from './pages/CreditCalculatorPage';

import { ShopRewardsPage } from './pages/other/ShopRewardsPage';
import MyOrdersPage from './pages/other/MyOrdersPage';

import EarnAsYouSpendPage from './pages/other/EarnAsYouSpendPage';
import DigitalPaymentResultPage from './pages/other/DigitalPaymentResultPage';
import CheckoutPage from './pages/other/CheckoutPage';
import OrderSuccessPage from './pages/other/OrderSuccessPage';
import { GoalsPage } from './pages/goals/GoalsPage';
import { BudgetPage } from './pages/budget/BudgetPage';
import TeknoFinansPage from './pages/apps/TeknoFinansPage';
import TeknoHizmetPage from './pages/apps/TeknoHizmetPage';
import TeknoKapsulPage from './pages/apps/TeknoKapsulPage';
import TeknoFirsatPage from './pages/other/TeknoFirsatPage';
import TeknomailPage from './pages/other/TeknomailPage';
import TeknodeskPage from './pages/other/TeknodeskPage';
import PaymentPlansListPage from './pages/financial/PaymentPlansListPage';
import PaymentPlanNewPage from './pages/financial/PaymentPlanNewPage';
import PaymentPlanDetailPage from './pages/financial/PaymentPlanDetailPage';
import PaymentPlanEditPage from './pages/financial/PaymentPlanEditPage';
// Premium sayfaları geçici olarak kaldırıldı
// import PremiumIntroPage from './pages/PremiumIntroPage';
// import PremiumManagePage from './pages/PremiumManagePage';
// import AdminPremiumPage from './pages/AdminPremiumPage';
// import PremiumSuccessPage from './pages/PremiumSuccessPage';
// import PremiumCancelPage from './pages/PremiumCancelPage';
// import { PremiumProvider } from './contexts/PremiumContext';
import { ResponsiveTestPage } from './pages/test/ResponsiveTestPage';
import WorkTrackingPage from './pages/WorkTrackingPage';
import PharmacyPage from './pages/PharmacyPage';
import KendimPage from './pages/KendimPage';
import EvimPage from './pages/EvimPage';
import BankamPage from './pages/BankamPage';
import WebViewAuthPage from './pages/auth/WebViewAuthPage';
import { VerifyPage } from './pages/auth/VerifyPage';
import { IsBankCallbackPage } from './pages/auth/IsBankCallbackPage';
// eKira imports
import { EkiraProvider } from './pages/ekira/context/EkiraContext';
import EkiraDashboard from './pages/ekira/EkiraDashboard';
import EkiraProperties from './pages/ekira/EkiraProperties';
import EkiraContracts from './pages/ekira/EkiraContracts';
import EkiraInvoices from './pages/ekira/EkiraInvoices';
import EkiraNewContract from './pages/ekira/EkiraNewContract';
import EkiraContractDetail from './pages/ekira/EkiraContractDetail';
// AppTabs removed - navigation handled by MobileNavigation
import { useLocation } from 'react-router-dom';

const TeknoRouteContent = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Sayfa değişikliklerinde scroll'u en üste al
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  

  return (
    <div className="min-h-screen bg-background">
      <MobileNavigation />
      <OfflineIndicator />
      <div className="md:pt-16 pb-20 md:pb-4">
        {children}
      </div>
    </div>
  );
};

const TeknoRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <TeknoRouteContent>
        {children}
      </TeknoRouteContent>
    </AuthGuard>
  );
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/webview-auth',
    element: <AuthProvider><WebViewAuthPage /></AuthProvider>
  },
  {
    path: '/verify',
    element: <AuthProvider><VerifyPage /></AuthProvider>
  },
  {
    path: '/auth/callback/isbank',
    element: <AuthProvider><IsBankCallbackPage /></AuthProvider>
  },
  {
    path: '/dashboard',
    element: <Navigate to="/" replace />
  },


  {
    path: '/subscriptions',
    element: <TeknoRoute><SubscriptionsPage /></TeknoRoute>
  },
  {
    path: '/analytics',
    element: <TeknoRoute><FinancialAnalytics /></TeknoRoute>
  },

  {
    path: '/income',
    element: <TeknoRoute><IncomePage /></TeknoRoute>
  },
  {
    path: '/expenses',
    element: <TeknoRoute><ExpensePage /></TeknoRoute>
  },
  {
    path: '/financial-data',
    element: <TeknoRoute><FinancialDataPage /></TeknoRoute>
  },
  {
    path: '/settings',
    element: <TeknoRoute><SettingsPage /></TeknoRoute>
  },
  {
    path: '/notes',
    element: <TeknoRoute><NotesPage /></TeknoRoute>
  },
  {
    path: '/calendar',
    element: <TeknoRoute><CalendarPage /></TeknoRoute>
  },
  {
    path: '/notifications',
    element: <TeknoRoute><NotificationsPage /></TeknoRoute>
  },
  {
    path: '/faq',
    element: <TeknoRoute><FAQPage /></TeknoRoute>
  },
  {
    path: '/other',
    element: <TeknoRoute><OtherPage /></TeknoRoute>
  },
  {
    path: '/cargo-tracking',
    element: <TeknoRoute><CargoTrackingPage /></TeknoRoute>
  },
  {
    path: '/attendance',
    element: <TeknoRoute><AttendancePage /></TeknoRoute>
  },
  {
    path: '/ai-assistant',
    element: <TeknoRoute><AIAssistantPage /></TeknoRoute>
  },
  {
    path: '/services-list',
    element: <TeknoRoute><ServicesListPage /></TeknoRoute>
  },
  {
    path: '/application/:serviceId',
    element: <TeknoRoute><ApplicationPage /></TeknoRoute>
  },
  {
    path: '/application',
    element: <Navigate to="/services-list" replace />
  },
  {
    path: '/applications',
    element: <TeknoRoute><ApplicationsListPage /></TeknoRoute>
  },
  {
    path: '/financial',
    element: <TeknoRoute><FinancialDataPage /></TeknoRoute>
  },
  {
    path: '/credit-score',
    element: <TeknoRoute><CreditScorePage /></TeknoRoute>
  },
  {
    path: '/warranty-tracking',
    element: <TeknoRoute><WarrantyTrackingPage /></TeknoRoute>
  },

  {
    path: '/portfolio',
    element: <TeknoRoute><PortfolioPage /></TeknoRoute>
  },
  {
    path: '/stock-market',
    element: <TeknoRoute><StockMarketPage /></TeknoRoute>
  },
  {
    path: '/tekno-finans',
    element: <TeknoRoute><TeknoFinansPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul',
    element: <TeknoRoute><TeknoKapsulPage /></TeknoRoute>
  },
  {
    path: '/tekno-hizmet',
    element: <TeknoRoute><TeknoHizmetPage /></TeknoRoute>
  },
  // Eski route'ları yeni route'lara yönlendir
  {
    path: '/mobile-finance',
    element: <Navigate to="/tekno-finans" replace />
  },
  {
    path: '/teknokapsul',
    element: <Navigate to="/tekno-kapsul" replace />
  },
  {
    path: '/services',
    element: <Navigate to="/tekno-hizmet" replace />
  },
  {
     path: '/tekno-firsat',
     element: <TeknoRoute><TeknoFirsatPage /></TeknoRoute>
   },
  {
    path: '/teknomail',
    element: <TeknoRoute><TeknomailPage /></TeknoRoute>
  },
  {
    path: '/teknodesk',
    element: <TeknoRoute><TeknodeskPage /></TeknoRoute>
  },


  {
    path: '/shop-rewards',
    element: <TeknoRoute><ShopRewardsPage /></TeknoRoute>
  },

  {
    path: '/dijital-kodlar',
    element: <TeknoRoute><EarnAsYouSpendPage /></TeknoRoute>
  },
  {
    path: '/dijital-kodlar/odeme-sonuc',
    element: <TeknoRoute><DigitalPaymentResultPage /></TeknoRoute>
  },
  {
    path: '/other/earn-as-you-spend',
    element: <Navigate to="/dijital-kodlar" replace />
  },
  {
    path: '/other/shop-rewards',
    element: <TeknoRoute><ShopRewardsPage /></TeknoRoute>
  },
  {
    path: '/other/checkout',
    element: <TeknoRoute><CheckoutPage /></TeknoRoute>
  },
  {
    path: '/other/order-success',
    element: <TeknoRoute><OrderSuccessPage /></TeknoRoute>
  },
  {
    path: '/other/my-orders',
    element: <TeknoRoute><MyOrdersPage /></TeknoRoute>
  },
  {
    path: '/goals',
    element: <TeknoRoute><GoalsPage /></TeknoRoute>
  },
  {
    path: '/budget',
    element: <TeknoRoute><BudgetPage /></TeknoRoute>
  },
  {
    path: '/documents',
    element: <TeknoRoute><DocumentsPage /></TeknoRoute>
  },
  {
    path: '/accounts',
    element: <TeknoRoute><AccountsPage /></TeknoRoute>
  },
  {
    path: '/all-transactions',
    element: <TeknoRoute><AllTransactionsPage /></TeknoRoute>
  },
  {
    path: '/admin',
    element: <TeknoRoute><AdminPage /></TeknoRoute>
  },
  // Premium rotaları geçici olarak kaldırıldı
  // {
  //   path: '/premium',
  //   element: <ProtectedRoute><PremiumIntroPage /></ProtectedRoute>
  // },
  // {
  //   path: '/premium/manage',
  //   element: <ProtectedRoute><PremiumManagePage /></ProtectedRoute>
  // },
  // {
  //   path: '/premium/success',
  //   element: <ProtectedRoute><PremiumSuccessPage /></ProtectedRoute>
  // },
  // {
  //   path: '/premium/cancel',
  //   element: <ProtectedRoute><PremiumCancelPage /></ProtectedRoute>
  // },
  // {
  //   path: '/admin/premium',
  //   element: <ProtectedRoute><AdminPremiumPage /></ProtectedRoute>
  // },
  {
    path: '/test/responsive',
    element: <TeknoRoute><ResponsiveTestPage /></TeknoRoute>
  },
  {
    path: '/work-tracking',
    element: <TeknoRoute><WorkTrackingPage /></TeknoRoute>
  },
  {
    path: '/kapsulum',
    element: <TeknoRoute><KendimPage /></TeknoRoute>
  },
  {
    path: '/evim',
    element: <TeknoRoute><EvimPage /></TeknoRoute>
  },
  {
    path: '/bankam',
    element: <TeknoRoute><BankamPage /></TeknoRoute>
  },
  {
    path: '/pharmacy',
    element: <TeknoRoute><PharmacyPage /></TeknoRoute>
  },
  // eKira routes
  {
    path: '/ekira',
    element: <TeknoRoute><EkiraProvider><EkiraDashboard /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/ekira/properties',
    element: <TeknoRoute><EkiraProvider><EkiraProperties /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/ekira/contracts',
    element: <TeknoRoute><EkiraProvider><EkiraContracts /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/ekira/invoices',
    element: <TeknoRoute><EkiraProvider><EkiraInvoices /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/ekira/contracts/new',
    element: <TeknoRoute><EkiraProvider><EkiraNewContract /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/ekira/contracts/:id',
    element: <TeknoRoute><EkiraProvider><EkiraContractDetail /></EkiraProvider></TeknoRoute>
  },
  {
    path: '/credit-calculator',
    element: <TeknoRoute><CreditCalculatorPage2 /></TeknoRoute>
  },

  {
    path: '/tekno-finans/income',
    element: <TeknoRoute><IncomePage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/expenses',
    element: <TeknoRoute><ExpensePage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/goals',
    element: <TeknoRoute><GoalsPage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/portfolio',
    element: <TeknoRoute><PortfolioPage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/stock-market',
    element: <TeknoRoute><StockMarketPage /></TeknoRoute>
  },

  {
    path: '/tekno-finans/financial-data',
    element: <TeknoRoute><FinancialDataPage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/credit-score',
    element: <TeknoRoute><CreditScorePage /></TeknoRoute>
  },

  {
    path: '/tekno-finans/credit-calculator',
    element: <TeknoRoute><CreditCalculatorPage2 /></TeknoRoute>
  },
  {
    path: '/payment-plan',
    element: <TeknoRoute><PaymentPlansListPage /></TeknoRoute>
  },
  {
    path: '/payment-plan/new',
    element: <TeknoRoute><PaymentPlanNewPage /></TeknoRoute>
  },
  {
    path: '/payment-plan/:id',
    element: <TeknoRoute><PaymentPlanDetailPage /></TeknoRoute>
  },
  {
    path: '/payment-plan/:id/edit',
    element: <TeknoRoute><PaymentPlanEditPage /></TeknoRoute>
  },
  {
    path: '/tekno-finans/payment-plan',
    element: <Navigate to="/payment-plan" replace />
  },
  {
    path: '/tekno-finans/payment-plans',
    element: <Navigate to="/payment-plan" replace />
  },
  {
    path: '/tekno-finans/payment-plans/new',
    element: <Navigate to="/payment-plan/new" replace />
  },
  {
    path: '/tekno-finans/payment-plans/:id',
    element: <Navigate to="/payment-plan/:id" replace />
  },
  {
    path: '/tekno-finans/payment-plans/:id/edit',
    element: <Navigate to="/payment-plan/:id/edit" replace />
  },
  {
    path: '/tekno-kapsul',
    element: <TeknoRoute><TeknoKapsulPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/services',
    element: <TeknoRoute><Services /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/cargo-tracking',
    element: <TeknoRoute><CargoTrackingPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/work-tracking',
    element: <TeknoRoute><WorkTrackingPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/documents',
    element: <TeknoRoute><DocumentsPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/notes',
    element: <TeknoRoute><NotesPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/calendar',
    element: <TeknoRoute><CalendarPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/subscriptions',
    element: <TeknoRoute><SubscriptionsPage /></TeknoRoute>
  },
  {
    path: '/tekno-kapsul/warranty-tracking',
    element: <TeknoRoute><WarrantyTrackingPage /></TeknoRoute>
  },
  {
    path: '/tekno-hizmet',
    element: <TeknoRoute><TeknoHizmetPage /></TeknoRoute>
  },
  {
    path: '/sentry-test',
    element: <TeknoRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Sentry Test Sayfası</h1>
        <div className="space-y-4">
          <button 
            onClick={() => {
              try {
                throw new Error("🚨 Bu bir test hatasıdır (TeknoKapsül)!");
              } catch (err) {
                Sentry.captureException(err);
                alert("Test hatası Sentry'ye gönderildi! Dashboard'u kontrol edin.");
              }
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            📤 Test Hatası Gönder
          </button>
          <button 
            onClick={() => {throw new Error("🚨 Bu direkt hata fırlatma testi!");}} 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            💥 Direkt Hata Fırlat
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">📊 Sentry Dashboard:</h3>
          <a 
            href="https://teknokapsul.sentry.io/issues/?project=4509753604702208" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Hataları Görüntüle →
          </a>
        </div>
      </div>
    </TeknoRoute>
  },
  {
    path: '/professional-home',
    element: <TeknoRoute><ProfessionalHomePage /></TeknoRoute>
  },
  {
    path: '/',
    element: <TeknoRoute><ProfessionalHomePage /></TeknoRoute>
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
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 transition-colors duration-300">
          {/* Mobil uygulamadan gelen kimlik doğrulama token'ını işle */}
          <MobileAuthHandler 
            onAuthSuccess={() => {
              console.log('✅ Mobil token ile giriş başarılı');
            }} 
            onAuthFailure={(error) => {
              console.error('❌ Mobil token ile giriş başarısız:', error?.message || error);
            }} 
          />
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Analytics />
          <SpeedInsights />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Bir hata oluştu</h1>
        <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Bilinmeyen hata'}</p>
        <button 
          onClick={resetError}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  ),
  beforeCapture: (scope) => {
    scope.setTag('errorBoundary', true);
  },
});