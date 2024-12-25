import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Payment } from '../../types/data';
import { Subscription } from '../../types/subscription';
import { formatCurrency } from '../../utils/currency';
import { formatDate, calculateDaysRemaining } from '../../utils/date';

interface AlertsProps {
  upcomingPayments: Payment[];
  expiringSubscriptions: Subscription[];
}

export const Alerts: React.FC<AlertsProps> = ({ upcomingPayments, expiringSubscriptions }) => {
  // Sadece ödenmemiş ve yaklaşan ödemeleri filtrele
  const filteredPayments = upcomingPayments.filter(payment => 
    payment.status === 'Ödenmedi' && 
    calculateDaysRemaining(payment.date) <= 7 && 
    calculateDaysRemaining(payment.date) > 0
  );

  if (filteredPayments.length === 0 && expiringSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Dikkat Edilmesi Gerekenler</h3>
          <div className="mt-2 text-sm text-yellow-700">
            {filteredPayments.length > 0 && (
              <div className="mb-2">
                <p className="font-medium">Yaklaşan Ödemeler:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {filteredPayments.map(payment => (
                    <li key={payment.id}>
                      {payment.description} - {formatCurrency(payment.amount)} ({formatDate(payment.date)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {expiringSubscriptions.length > 0 && (
              <div>
                <p className="font-medium">Yakında Bitecek Abonelikler:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {expiringSubscriptions.map(subscription => (
                    <li key={subscription.id}>
                      {subscription.name} - Bitiş: {formatDate(subscription.endDate)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};