import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/Toast';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PropertiesList from './pages/properties/PropertiesList';
import NewProperty from './pages/properties/NewProperty';
import EditProperty from './pages/properties/EditProperty';
import ContractsList from './pages/contracts/ContractsList';
import NewContract from './pages/contracts/NewContract';
import ContractDetails from './pages/contracts/ContractDetails';
import Edevlet from './pages/contracts/Edevlet';
import EditContract from './pages/contracts/EditContract';
import Renewal from './pages/contracts/Renewal';
import UpfrontOffer from './pages/contracts/UpfrontOffer';
import InvoicesList from './pages/payments/InvoicesList';
import PaymentResult from './pages/payments/PaymentResult';
import IndependentPay from './pages/payments/IndependentPay';
import QuickPayQR from './pages/payments/QuickPayQR';
import PayoutsList from './pages/payouts/PayoutsList';
import GuestTenant from './pages/guest/GuestTenant';
import GuestPay from './pages/guest/GuestPay';
import RequestsList from './pages/requests/RequestsList';
import Wallet from './pages/wallet/Wallet';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import NotificationsPage from './pages/notifications/NotificationsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContracts from './pages/admin/AdminContracts';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminHolidays from './pages/admin/AdminHolidays';
import AdminAudit from './pages/admin/AdminAudit';
import AdminAgents from './pages/admin/AdminAgents';
import AdminPermissions from './pages/admin/AdminPermissions';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import LegalCases from './pages/legal/LegalCases';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <ToastContainer />
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tenant/:contractId" element={<GuestTenant />} />
                <Route path="pay/:contractId" element={<GuestPay />} />
                <Route path="properties" element={<PropertiesList />} />
                <Route path="properties/new" element={<NewProperty />} />
                <Route path="properties/:id/edit" element={<EditProperty />} />
                <Route path="contracts" element={<ContractsList />} />
                <Route path="contracts/new" element={<NewContract />} />
                <Route path="contracts/:id" element={<ContractDetails />} />
                <Route path="contracts/:id/edevlet" element={<Edevlet />} />
                <Route path="contracts/:id/renewal" element={<Renewal />} />
                <Route path="contracts/:id/edit" element={<EditContract />} />
                <Route path="contracts/:id/upfront" element={<UpfrontOffer />} />
                <Route path="invoices" element={<InvoicesList />} />
                <Route path="payment-result" element={<PaymentResult />} />
                <Route path="independent-pay" element={<IndependentPay />} />
                <Route path="quick-pay-qr" element={<QuickPayQR />} />
                <Route path="payouts" element={<PayoutsList />} />
                <Route path="requests" element={<RequestsList />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="legal-cases" element={<LegalCases />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />

                {/* Admin Routes */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/contracts" element={<AdminContracts />} />
                <Route path="admin/payments" element={<AdminPayments />} />
                <Route path="admin/payouts" element={<AdminPayouts />} />
                <Route path="admin/holidays" element={<AdminHolidays />} />
                <Route path="admin/audit" element={<AdminAudit />} />
                <Route path="admin/agents" element={<AdminAgents />} />
                <Route path="admin/permissions" element={<AdminPermissions />} />
                <Route path="admin/withdrawals" element={<AdminWithdrawals />} />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
