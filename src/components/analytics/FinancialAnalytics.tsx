import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';


interface AnalyticsData {
  totalSpent: number;
  totalIncome: number;
  savingsRate: number;
  monthlyTrend: any[];
  categoryBreakdown: any[];
  predictions: any[];
  insights: any[];
}

interface FilterOptions {
  period: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  category: string;
  type: 'all' | 'income' | 'expense';
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',
  success: '#22c55e'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export const FinancialAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    period: '3M',
    category: 'all',
    type: 'all'
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories' | 'predictions'>('overview');
  
  const { data: payments = [] } = useFirebaseData<any>('payments');
  const { data: subscriptions = [] } = useFirebaseData<any>('subscriptions');

  useEffect(() => {
    loadAnalyticsData();
  }, [filters, payments, subscriptions]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on filter
      const endDate = new Date();
      const startDate = new Date();
      
      switch (filters.period) {
        case '1M':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'ALL':
          startDate.setFullYear(2020); // Far back date
          break;
      }

      // Filter payments based on criteria
      const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        const inDateRange = paymentDate >= startDate && paymentDate <= endDate;
        const matchesCategory = filters.category === 'all' || payment.category === filters.category;
        const matchesType = filters.type === 'all' || 
          (filters.type === 'expense' && payment.amount > 0) ||
          (filters.type === 'income' && payment.amount < 0);
        
        return inDateRange && matchesCategory && matchesType;
      });

      // Calculate analytics
      const totalSpent = filteredPayments
        .filter(p => p.amount > 0)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalIncome = Math.abs(filteredPayments
        .filter(p => p.amount < 0)
        .reduce((sum, p) => sum + p.amount, 0));
      
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

      // Monthly trend data
      const monthlyData = generateMonthlyTrend(filteredPayments);
      
      // Category breakdown
      const categoryData = generateCategoryBreakdown(filteredPayments);
      
      // Mock predictions and insights
      const predictions: any[] = [];
      const insights: any[] = [];

      setAnalyticsData({
        totalSpent,
        totalIncome,
        savingsRate,
        monthlyTrend: monthlyData,
        categoryBreakdown: categoryData,
        predictions,
        insights
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (payments: any[]) => {
    const monthlyMap = new Map();
    
    payments.forEach(payment => {
      const date = new Date(payment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
          income: 0,
          expense: 0,
          net: 0
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      if (payment.amount > 0) {
        monthData.expense += payment.amount;
      } else {
        monthData.income += Math.abs(payment.amount);
      }
      monthData.net = monthData.income - monthData.expense;
    });
    
    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  const generateCategoryBreakdown = (payments: any[]) => {
    const categoryMap = new Map();
    
    payments.filter((p: any) => p.amount > 0).forEach((payment: any) => {
      const category = payment.category || 'Diğer';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          value: 0,
          count: 0
        });
      }
      
      const categoryData = categoryMap.get(category);
      categoryData.value += payment.amount;
      categoryData.count += 1;
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const dataToExport = {
      summary: {
        totalSpent: analyticsData.totalSpent,
        totalIncome: analyticsData.totalIncome,
        savingsRate: analyticsData.savingsRate,
        period: filters.period
      },
      monthlyTrend: analyticsData.monthlyTrend,
      categoryBreakdown: analyticsData.categoryBreakdown,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finansal-analiz-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8" />
        <span className="ml-3 text-gray-600">Analiz verileri yükleniyor...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Analiz verileri yüklenemedi</p>
        <button 
          onClick={loadAnalyticsData}
          className="mt-4 btn btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finansal Analiz</h1>
          <p className="text-gray-600">Detaylı harcama analizi ve tahminler</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportData}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Dışa Aktar</span>
          </button>
          
          <button
            onClick={loadAnalyticsData}
            className="btn btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtreler:</span>
          </div>
          
          <select
            value={filters.period}
            onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1M">Son 1 Ay</option>
            <option value="3M">Son 3 Ay</option>
            <option value="6M">Son 6 Ay</option>
            <option value="1Y">Son 1 Yıl</option>
            <option value="ALL">Tümü</option>
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Tüm İşlemler</option>
            <option value="expense">Sadece Giderler</option>
            <option value="income">Sadece Gelirler</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Harcama</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(analyticsData.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analyticsData.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Tutar</p>
              <p className={`text-2xl font-bold ${
                analyticsData.totalIncome - analyticsData.totalSpent >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(analyticsData.totalIncome - analyticsData.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasarruf Oranı</p>
              <p className={`text-2xl font-bold ${
                analyticsData.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analyticsData.savingsRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Genel Bakış' },
            { id: 'trends', label: 'Trendler' },
            { id: 'categories', label: 'Kategoriler' },
            { id: 'predictions', label: 'Tahminler' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Aylık Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke={COLORS.success} 
                    fill={COLORS.success}
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stackId="2" 
                    stroke={COLORS.danger} 
                    fill={COLORS.danger}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Category Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Kategori Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Detaylı Trend Analizi</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke={COLORS.success} 
                  strokeWidth={3}
                  name="Gelir"
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke={COLORS.danger} 
                  strokeWidth={3}
                  name="Gider"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke={COLORS.primary} 
                  strokeWidth={3}
                  name="Net"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Kategori Detayları</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {analyticsData.predictions.length > 0 ? (
              analyticsData.predictions.map((prediction, index) => (
                <div key={index} className="card p-6">
                  <h4 className="font-semibold text-lg mb-2">{prediction.title}</h4>
                  <p className="text-gray-600 mb-4">{prediction.description}</p>
                  {prediction.chart && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prediction.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke={COLORS.warning} 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ))
            ) : (
              <div className="card p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tahmin oluşturmak için daha fazla veri gerekli</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};