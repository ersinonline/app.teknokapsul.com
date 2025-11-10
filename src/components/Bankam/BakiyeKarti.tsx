import React from 'react';
import { DollarSign } from 'lucide-react';

interface BakiyeKartiProps {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  loading: boolean;
}

const BakiyeKarti: React.FC<BakiyeKartiProps> = ({ netBalance, totalIncome, totalExpense, loading }) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-80">Toplam Bakiye</p>
          <p className="text-3xl font-bold tracking-tight">
            {loading ? 'Yükleniyor...' : `₺${netBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <p className="opacity-80">Gelir</p>
          </div>
          <p className="font-semibold text-lg">
            {loading ? '...' : `+₺${totalIncome.toLocaleString('tr-TR')}`}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <p className="opacity-80">Gider</p>
          </div>
          <p className="font-semibold text-lg">
            {loading ? '...' : `-₺${totalExpense.toLocaleString('tr-TR')}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BakiyeKarti;