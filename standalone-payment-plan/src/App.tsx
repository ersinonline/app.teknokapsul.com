import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreditCalculatorPage from './pages/CreditCalculatorPage';
import PaymentPlanNewPage from './pages/PaymentPlanNewPage';
import PaymentPlanDetailPage from './pages/PaymentPlanDetailPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/credit" element={<CreditCalculatorPage />} />
      <Route path="/new" element={<PaymentPlanNewPage />} />
      <Route path="/plan/:id" element={<PaymentPlanDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
