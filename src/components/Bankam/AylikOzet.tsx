import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AylikOzetProps {
  totalIncome: number;
  totalExpense: number;
  loading: boolean;
}

const AylikOzet: React.FC<AylikOzetProps> = ({ totalIncome, totalExpense, loading }) => {
  const chartData = {
    labels: ['Gelir', 'Gider'],
    datasets: [
      {
        label: 'Bu Ay',
        data: [totalIncome, totalExpense],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Aylık Gelir Gider Özeti',
      },
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-bold text-gray-800 mb-4">Aylık Özet</h2>
      {loading ? (
        <p className="text-center text-gray-500">Yükleniyor...</p>
      ) : (
        <Bar options={chartOptions} data={chartData} />
      )}
    </div>
  );
};

export default AylikOzet;