import React, { useState } from 'react';
import { CreditCard, Search, Filter, Plus } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { EmptyState } from './common/EmptyState';
import { PaymentSummary } from './payments/PaymentSummary';
import { PaymentStats } from './payments/PaymentStats';
import { PaymentList } from './payments/PaymentList';
import { PaymentForm } from './payments/PaymentForm';
import { Payment } from '../types/data';
import { useAuth } from '../contexts/AuthContext';
import { calculatePaymentStats } from '../utils/payments';

export const Payments = () => {
  const { user } = useAuth();
  const { data: payments = [], loading, error, reload } = useFirebaseData<Payment>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Borçlarınız yüklenirken bir hata oluştu." />;
  if (!user) return <ErrorMessage message="Lütfen giriş yapın." />;

  const { totalAmount, pendingAmount, paidAmount } = calculatePaymentStats(payments);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      (payment.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.bank?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && payment.status === 'Ödendi') ||
      (filterStatus === 'pending' && payment.status === 'Ödenmedi');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Borçlarım</h1>
        <button
          onClick={() => setIsPaymentFormOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Borç Ekle
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Borç ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Borç ara"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'pending')}
          className="w-full sm:w-auto p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <option value="all">Tümü</option>
          <option value="paid">Ödenmiş</option>
          <option value="pending">Ödenmemiş</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PaymentSummary totalAmount={totalAmount} />
        </div>
        <div>
          <PaymentStats pendingAmount={pendingAmount} paidAmount={paidAmount} />
        </div>
      </div>

      {/* Payment List */}
      {filteredPayments.length > 0 ? (
        <PaymentList payments={filteredPayments} />
      ) : (
        <EmptyState
          icon={CreditCard}
          title="Eşleşen Borç Bulunamadı"
          description="Aramanıza veya seçtiğiniz filtreye uygun borç bulunamadı."
        />
      )}

      {/* Payment Form Modal */}
      {isPaymentFormOpen && (
        <PaymentForm
          onClose={() => setIsPaymentFormOpen(false)}
          onSave={reload}
        />
      )}
    </div>
  );
};