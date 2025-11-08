import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

interface SonIslemlerProps {
  transactions: Transaction[];
  loading: boolean;
}

const SonIslemler: React.FC<SonIslemlerProps> = ({ transactions, loading }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-bold text-gray-800 mb-4">Son İşlemler</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-500">Yükleniyor...</p>
        ) : transactions.length > 0 ? (
          transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">İşlem bulunmuyor.</p>
        )}
      </div>
    </div>
  );
};

export default SonIslemler;