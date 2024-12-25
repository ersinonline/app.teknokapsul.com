import React from 'react';
import { Award, Gift } from 'lucide-react';
import { LoyaltyPoints } from '../../services/loyalty.service';
import { formatDate } from '../../utils/date';

interface LoyaltyCardProps {
  loyalty: LoyaltyPoints;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ loyalty }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">TeknoKapsül Puanlarım</h3>
            <p className="text-3xl font-bold mt-2">{loyalty.totalPoints} Puan</p>
          </div>
          <Award className="w-12 h-12 opacity-75" />
        </div>
      </div>
      
      <div className="p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Puan Geçmişi</h4>
        <div className="space-y-4">
          {loyalty.history.slice(0, 5).map((record, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{record.action}</p>
                <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
              </div>
              <span className={`text-sm font-medium ${
                record.points > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {record.points > 0 ? '+' : ''}{record.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};