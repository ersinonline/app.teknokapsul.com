import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PortfolioItem, PORTFOLIO_CATEGORIES } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { portfolioService } from '../../services/portfolio.service';

interface PortfolioChartProps {
  portfolioItems: PortfolioItem[];
  showValues?: boolean;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  portfolioItems,
  showValues = true
}) => {
  // Aynı sembolleri birleştir
  const consolidatedItems = portfolioService.consolidatePortfolioBySymbol(portfolioItems);

  // Prepare data for pie chart (by category)
  const categoryData = consolidatedItems.reduce((acc, item) => {
    const categoryName = PORTFOLIO_CATEGORIES[item.type] || item.type;
    const existing = acc.find(d => d.name === categoryName);
    if (existing) {
      existing.value += item.totalValue;
      existing.count += 1;
    } else {
      acc.push({
        name: categoryName,
        value: item.totalValue,
        count: 1
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; count: number }>);

  // Prepare data for bar chart (consolidated items)
  const itemsData = consolidatedItems
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10) // Show top 10 items
    .map(item => ({
      name: item.name,
      value: item.totalValue,
      return: item.totalReturn,
      returnPercentage: item.returnPercentage
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'value' && 'Değer: '}
              {entry.dataKey === 'return' && 'Getiri: '}
              {entry.dataKey === 'returnPercentage' && 'Getiri Oranı: '}
              {entry.dataKey === 'returnPercentage' 
                ? `%${entry.value.toFixed(2)}`
                : formatCurrency(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Değer: {showValues ? formatCurrency(data.value) : '••••••'}
          </p>
          <p className="text-sm text-gray-600">
            Adet: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!portfolioItems || portfolioItems.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portföy Dağılımı</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <PieChart className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Henüz yatırım bulunmuyor</p>
          <p className="text-sm text-gray-400 mt-1">
            Portföyünüze yatırım ekleyerek grafikleri görüntüleyebilirsiniz
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category Distribution - Pie Chart */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Kategori Dağılımı</h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => window.innerWidth > 640 ? `${name} (${(percent * 100).toFixed(1)}%)` : `${(percent * 100).toFixed(1)}%`}
                outerRadius={window.innerWidth > 640 ? 80 : 60}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Holdings - Bar Chart */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">En Büyük Yatırımlar</h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={itemsData}
              margin={{
                top: 5,
                right: window.innerWidth > 640 ? 30 : 10,
                left: window.innerWidth > 640 ? 20 : 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={window.innerWidth > 640 ? 80 : 60}
                fontSize={window.innerWidth > 640 ? 12 : 10}
              />
              <YAxis 
                tickFormatter={(value) => showValues ? formatCurrency(value) : '••••'}
                fontSize={window.innerWidth > 640 ? 12 : 10}
              />
              <Tooltip content={<CustomTooltip />} />
              {window.innerWidth > 640 && <Legend />}
              <Bar 
                dataKey="value" 
                fill="#3B82F6" 
                name="Toplam Değer"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="return" 
                fill="#10B981" 
                name="Getiri"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};