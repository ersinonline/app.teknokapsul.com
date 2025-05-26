import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

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

  // Otomatik yenilenenler önce, sonra bitiş tarihine göre sıralama
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    if (a.autoRenew && !b.autoRenew) return -1;
    if (!a.autoRenew && b.autoRenew) return 1;
    if (!a.autoRenew && !b.autoRenew) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {sortedSubscriptions.map((subscription) => {
        const daysRemaining = subscription.autoRenew ? null : calculateDaysRemaining(subscription.endDate);
        const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
        const isExpired = daysRemaining !== null && daysRemaining <= 0;

        return (
          <div
            key={subscription.id}
            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
              isExpired ? 'border-l-4 border-red-600' : 
              subscription.autoRenew ? 'border-l-4 border-green-600' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(subscription.price)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  {subscription.autoRenew ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <RefreshCw className="w-4 h-4" />
                      Her ay {subscription.renewalDay}. günü yenilenir
                    </span>
                  ) : (
                    <span>
                      Bitiş: {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </p>
              </div>

              {!subscription.autoRenew && daysRemaining !== null && (
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
                      ? 'Süresi Doldu'
                      : isExpiringSoon
                      ? `${daysRemaining} gün kaldı`
                      : `${daysRemaining} gün`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};