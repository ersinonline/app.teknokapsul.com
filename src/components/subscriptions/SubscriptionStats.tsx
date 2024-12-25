import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Aktif</p>
            <p className="text-2xl font-semibold">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Yakında Bitecek</p>
            <p className="text-2xl font-semibold">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Süresi Dolmuş</p>
            <p className="text-2xl font-semibold">{stats.expired}</p>
          </div>
        </div>
      </div>
    </div>
  );
};