import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Payment } from '../../types/data';
import { formatCurrency } from '../../utils/currency';
import { groupPaymentsByMonth } from '../../utils/payments';

export const SpendingTrends = () => {
  const { data: payments = [] } = useFirebaseData<Payment>('payments');

  const monthlyData = groupPaymentsByMonth(payments);
  const chartData = monthlyData.map(({ month, year, totalAmount, paidAmount }) => ({
    date: `${month} ${year}`,
    amount: totalAmount,
    paidAmount: paidAmount
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-6">Harcama Trendleri</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              contentStyle={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'amount' ? 'Toplam Harcama' : 'Ödenen'
              ]}
              labelStyle={{ color: '#666' }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#EAB308"
              strokeWidth={2}
              dot={{ fill: '#EAB308', strokeWidth: 2 }}
              name="Toplam"
            />
            <Line
              type="monotone"
              dataKey="paidAmount"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ fill: '#22C55E', strokeWidth: 2 }}
              name="Ödenen"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};