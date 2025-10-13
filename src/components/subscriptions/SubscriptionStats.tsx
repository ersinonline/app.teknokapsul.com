import React from 'react';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
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
    <div className="space-y-3 mx-1 lg:mx-0">
      {/* Toplam Abonelik - Geniş */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            <p className="text-sm text-gray-600">Toplam Abonelik</p>
          </div>
        </div>
      </div>
      
      {/* Aktif ve Yakında Bitecek - Yan Yana */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-600">Aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-600">Yakında Bitiyor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Süresi Dolmuş - Geniş (sadece varsa göster) */}
      {stats.expired > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              <p className="text-sm text-gray-600">Süresi Dolmuş</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};