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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Aktif</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Yakında Bitecek</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Süresi Dolmuş</p>
            <p className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white">{stats.expired}</p>
          </div>
        </div>
      </div>
    </div>
  );
};