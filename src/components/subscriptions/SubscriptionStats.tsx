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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-4 mx-1 lg:mx-0">
      <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-md lg:shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-1.5 lg:p-2 bg-green-100 rounded-md lg:rounded-lg">
            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Aktif</p>
            <p className="text-base lg:text-2xl font-semibold text-gray-900">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-md lg:shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-1.5 lg:p-2 bg-yellow-100 rounded-md lg:rounded-lg">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Yakında Bitecek</p>
            <p className="text-base lg:text-2xl font-semibold text-gray-900">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 lg:p-6 rounded-lg lg:rounded-xl shadow-md lg:shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-1.5 lg:p-2 bg-red-100 rounded-md lg:rounded-lg">
            <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs lg:text-sm text-gray-600">Süresi Dolmuş</p>
            <p className="text-base lg:text-2xl font-semibold text-gray-900">{stats.expired}</p>
          </div>
        </div>
      </div>
    </div>
  );
};