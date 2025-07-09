import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining } from '../../utils/date';

interface SubscriptionStatsProps {
  subscriptions: Subscription[];
}

export const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({ subscriptions }) => {
  const stats = subscriptions.reduce((acc, subscription) => {
    const daysRemaining = calculateDaysRemaining(subscription.endDate);
    if (daysRemaining <= 0) acc.expired++;
    else if (daysRemaining <= 7) acc.expiringSoon++;
    else acc.active++;
    return acc;
  }, { active: 0, expiringSoon: 0, expired: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Aktif</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Yakında Bitecek</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Süresi Dolmuş</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900">{stats.expired}</p>
          </div>
        </div>
      </div>
    </div>
  );
};