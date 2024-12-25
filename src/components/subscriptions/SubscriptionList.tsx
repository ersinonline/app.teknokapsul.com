import React from 'react';
import { Clock } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining } from '../../utils/date';

interface SubscriptionListProps {
  subscriptions: Subscription[];
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions }) => {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <p>Abonelik bulunmamaktadır.</p>
      </div>
    );
  }

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedSubscriptions.map((subscription) => {
        const daysRemaining = calculateDaysRemaining(subscription.endDate);
        const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
        const isExpired = daysRemaining <= 0;

        return (
          <div
            key={subscription.id}
            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
              isExpired ? 'border-l-4 border-red-600' : ''
            }`}
            aria-label={`Abonelik: ${subscription.name}, ${isExpired ? 'süresi dolmuş' : `${daysRemaining} gün kaldı`}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                <p className="text-sm text-gray-500">
                  Bitiş: {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  isExpired
                    ? 'bg-red-100 text-red-800'
                    : isExpiringSoon
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {isExpired
                    ? 'Bitti'
                    : isExpiringSoon
                    ? `${daysRemaining} gün kaldı`
                    : `${daysRemaining} gün`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};