import React from 'react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { Payment } from '../types/data';
import { formatCurrency } from '../utils/currency';
import { calculateDaysRemaining } from '../utils/date';
import { Card } from './common/Card';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';

export const Dashboard = () => {
  const { data: payments = [], loading, error } = useFirebaseData<Payment>('payments');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Veriler yüklenirken bir hata oluştu." />;

  // Ödeme istatistiklerini hesapla
  const stats = payments.reduce((acc, payment) => {
    acc.totalAmount += payment.amount;
    if (payment.status === 'Ödendi') {
      acc.paidAmount += payment.amount;
    } else {
      acc.unpaidAmount += payment.amount;
    }
    return acc;
  }, {
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0
  });

  // Yaklaşan ödemeleri filtrele
  const upcomingPayments = payments
    .filter(payment => {
      const daysLeft = calculateDaysRemaining(payment.date);
      return payment.status === 'Ödenmedi' && daysLeft > 0 && daysLeft <= 7;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Geciken ödemeleri filtrele
  const overduePayments = payments
    .filter(payment => {
      const daysLeft = calculateDaysRemaining(payment.date);
      return payment.status === 'Ödenmedi' && daysLeft <= 0;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Finansal Durum</h1>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Toplam Borç</p>
              <p className="text-2xl font-semibold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Ödenen</p>
              <p className="text-2xl font-semibold">{formatCurrency(stats.paidAmount)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Ödenmemiş</p>
              <p className="text-2xl font-semibold">{formatCurrency(stats.unpaidAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Uyarılar ve Yaklaşan Ödemeler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Ödemeler */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-medium">Yaklaşan Ödemeler</h2>
          </div>

          {upcomingPayments.length > 0 ? (
            <div className="space-y-3">
              {upcomingPayments.map(payment => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.date).toLocaleDateString('tr-TR')} ({calculateDaysRemaining(payment.date)} gün kaldı)
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Yaklaşan ödeme bulunmuyor.</p>
          )}
        </Card>

        {/* Geciken Ödemeler */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-medium">Geciken Ödemeler</h2>
          </div>

          {overduePayments.length > 0 ? (
            <div className="space-y-3">
              {overduePayments.map(payment => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.date).toLocaleDateString('tr-TR')} ({Math.abs(calculateDaysRemaining(payment.date))} gün gecikme)
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Geciken ödeme bulunmuyor.</p>
          )}
        </Card>
      </div>
    </div>
  );
};