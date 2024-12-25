import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining } from '../../utils/date';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions }) => {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p>Henüz herhangi bir abonelik eklenmedi.</p>
      </div>
    );
  }

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

  const getStatusInfo = (daysRemaining: number) => {
    if (daysRemaining <= 0) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Bitti',
        className: 'bg-red-100 text-red-800'
      };
    }
    if (daysRemaining <= 7) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: `${daysRemaining} gün kaldı`,
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      icon: <CheckCircle className="w-4 h-4" />,
      text: `${daysRemaining} gün`,
      className: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="overflow-x-auto" aria-label="Abonelik Tablosu">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Abonelik
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Bitiş Tarihi
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Durum
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSubscriptions.map((subscription) => {
            const daysRemaining = calculateDaysRemaining(subscription.endDate);
            const { icon, text, className } = getStatusInfo(daysRemaining);

            return (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}
                  >
                    {icon}
                    {text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};