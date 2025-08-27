import { useState, useEffect } from 'react';
import {
  CreditCard as CreditCardIcon,
  Banknote,
  PiggyBank,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  PieChart,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCreditCards,
  getCashAdvanceAccounts,
  getLoans,
  addCreditCard,
  addCashAdvanceAccount,
  addLoan,
  updateCreditCard,
  updateCashAdvanceAccount,
  updateLoan,
  deleteCreditCard,
  deleteCashAdvanceAccount,
  deleteLoan,
  calculateDebtRatio,
  calculateAvailableLimit,
  calculateLoanProgress
} from '../../services/financial.service';
import { CreditCard, CashAdvanceAccount, Loan, LOAN_TYPES } from '../../types/financial';
import { formatCurrency } from '../../utils/currency';

type TabType = 'creditCards' | 'cashAdvance' | 'loans';

// Chart colors
const CHART_COLORS = [
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

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialDataPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('creditCards');
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [cashAdvanceAccounts, setCashAdvanceAccounts] = useState<CashAdvanceAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [showCashAdvanceForm, setShowCashAdvanceForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingCreditCard, setEditingCreditCard] = useState<CreditCard | null>(null);
  const [editingCashAdvance, setEditingCashAdvance] = useState<CashAdvanceAccount | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Platform adını düzelt - eğer sayı ise banka isimlerine çevir
  const getPlatformDisplayName = (platformName: string) => {
    const bankNames: { [key: string]: string } = {
      '0': 'Ziraat Bankası',
      '1': 'İş Bankası', 
      '2': 'Garanti BBVA',
      '3': 'Akbank',
      '4': 'Yapı Kredi',
      '5': 'Halkbank',
      '6': 'VakıfBank',
      '7': 'Denizbank',
      '8': 'QNB Finansbank',
      '9': 'TEB'
    };
    
    // Eğer platformName sayısal bir ID ise, banka adına çevir
    if (bankNames[platformName]) {
      return bankNames[platformName];
    }
    
    // Eğer platformName zaten bir banka adı ise, doğru formatta göster
    const normalizedName = platformName.toLowerCase();
    
    // Yaygın banka adı varyasyonlarını standart forma çevir
    const bankNameMappings: { [key: string]: string } = {
      'ziraat': 'Ziraat Bankası',
      'ziraat bankası': 'Ziraat Bankası',
      'ziraatbankası': 'Ziraat Bankası',
      'is bankası': 'İş Bankası',
      'iş bankası': 'İş Bankası',
      'isbankası': 'İş Bankası',
      'işbankası': 'İş Bankası',
      'garanti': 'Garanti BBVA',
      'garanti bbva': 'Garanti BBVA',
      'garantibbva': 'Garanti BBVA',
      'akbank': 'Akbank',
      'yapı kredi': 'Yapı Kredi',
      'yapıkredi': 'Yapı Kredi',
      'yapikredi': 'Yapı Kredi',
      'halkbank': 'Halkbank',
      'vakıfbank': 'VakıfBank',
      'vakifbank': 'VakıfBank',
      'denizbank': 'Denizbank',
      'qnb finansbank': 'QNB Finansbank',
      'qnbfinansbank': 'QNB Finansbank',
      'finansbank': 'QNB Finansbank',
      'teb': 'TEB'
    };
    
    // Normalize edilmiş isimde eşleşme ara
    for (const [key, value] of Object.entries(bankNameMappings)) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
    
    // Eğer hiçbir eşleşme bulunamazsa, orijinal değeri döndür (ilk harfi büyük yap)
    return platformName.charAt(0).toUpperCase() + platformName.slice(1);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [creditCardsData, cashAdvanceData, loansData] = await Promise.all([
        getCreditCards(user.id),
        getCashAdvanceAccounts(user.id),
        getLoans(user.id)
      ]);
      
      setCreditCards(creditCardsData);
      setCashAdvanceAccounts(cashAdvanceData);
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCreditCard = async (id: string) => {
    if (window.confirm('Bu kredi kartını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCreditCard(user!.id, id);
        setCreditCards(prev => prev.filter(card => card.id !== id));
      } catch (error) {
        console.error('Error deleting credit card:', error);
      }
    }
  };

  const handleDeleteCashAdvance = async (id: string) => {
    if (window.confirm('Bu avans hesabını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCashAdvanceAccount(user!.id, id);
        setCashAdvanceAccounts(prev => prev.filter(account => account.id !== id));
      } catch (error) {
        console.error('Error deleting cash advance account:', error);
      }
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (window.confirm('Bu krediyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteLoan(user!.id, id);
        setLoans(prev => prev.filter(loan => loan.id !== id));
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  const handleAddCreditCard = async (formData: any) => {
    try {
      if (editingCreditCard) {
        await updateCreditCard(user!.id, editingCreditCard.id, formData);
        setEditingCreditCard(null);
      } else {
        await addCreditCard(user!.id, formData);
      }
      setShowCreditCardForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving credit card:', error);
      alert('Kredi kartı kaydedilirken bir hata oluştu.');
    }
  };

  const handleAddCashAdvance = async (formData: any) => {
    try {
      if (editingCashAdvance) {
        await updateCashAdvanceAccount(user!.id, editingCashAdvance.id, formData);
        setEditingCashAdvance(null);
      } else {
        await addCashAdvanceAccount(user!.id, formData);
      }
      setShowCashAdvanceForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving cash advance account:', error);
      alert('Avans hesabı kaydedilirken bir hata oluştu.');
    }
  };

  const handleAddLoan = async (formData: any) => {
    try {
      if (editingLoan) {
        await updateLoan(user!.id, editingLoan.id, formData);
        setEditingLoan(null);
      } else {
        await addLoan(user!.id, formData);
      }
      setShowLoanForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Kredi kaydedilirken bir hata oluştu.');
    }
  };



  const tabs = [
    { id: 'creditCards', label: 'Kredi Kartları', icon: CreditCardIcon, count: creditCards.length },
    { id: 'cashAdvance', label: 'Ek Hesapları', icon: Banknote, count: cashAdvanceAccounts.length },
    { id: 'loans', label: 'Krediler', icon: PiggyBank, count: loans.length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Toplam istatistikleri hesapla
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const totalCreditDebt = creditCards.reduce((sum, card) => sum + card.currentDebt, 0);
  const totalCashAdvanceLimit = cashAdvanceAccounts.reduce((sum, acc) => sum + acc.limit, 0);
  const totalCashAdvanceDebt = cashAdvanceAccounts.reduce((sum, acc) => sum + acc.currentDebt, 0);

  // Kartları bankaya göre grupla
  const groupCardsByBank = (cards: CreditCard[]) => {
    const grouped = cards.reduce((acc, card) => {
      if (!acc[card.bank]) {
        acc[card.bank] = [];
      }
      acc[card.bank].push(card);
      return acc;
    }, {} as Record<string, CreditCard[]>);
    
    return Object.entries(grouped).map(([bank, cards]) => ({
      bank,
      cards: cards.sort((a, b) => b.limit - a.limit), // Limite göre sırala
      totalLimit: cards.reduce((sum, card) => sum + card.limit, 0),
      totalDebt: cards.reduce((sum, card) => sum + card.currentDebt, 0)
    })).sort((a, b) => a.bank.localeCompare(b.bank, 'tr', { sensitivity: 'base' })); // Alfabetik sırala
  };

  // Nakit avans hesaplarını bankaya göre grupla
  const groupCashAdvanceByBank = (accounts: CashAdvanceAccount[]) => {
    const grouped = accounts.reduce((acc, account) => {
      if (!acc[account.bank]) {
        acc[account.bank] = [];
      }
      acc[account.bank].push(account);
      return acc;
    }, {} as Record<string, CashAdvanceAccount[]>);
    
    return Object.entries(grouped).map(([bank, accounts]) => ({
      bank,
      accounts: accounts.sort((a, b) => b.limit - a.limit), // Limite göre sırala
      totalLimit: accounts.reduce((sum, account) => sum + account.limit, 0),
      totalDebt: accounts.reduce((sum, account) => sum + account.currentDebt, 0)
    })).sort((a, b) => a.bank.localeCompare(b.bank, 'tr', { sensitivity: 'base' })); // Alfabetik sırala
  };

  // Kredileri bankaya göre grupla
  const groupLoansByBank = (loans: Loan[]) => {
    const grouped = loans.reduce((acc, loan) => {
      if (!acc[loan.bank]) {
        acc[loan.bank] = [];
      }
      acc[loan.bank].push(loan);
      return acc;
    }, {} as Record<string, Loan[]>);
    
    return Object.entries(grouped).map(([bank, loans]) => ({
      bank,
      loans: loans.sort((a, b) => b.totalAmount - a.totalAmount), // Toplam tutara göre sırala
      totalAmount: loans.reduce((sum, loan) => sum + loan.totalAmount, 0),
      totalRemaining: loans.reduce((sum, loan) => sum + loan.remainingAmount, 0)
    })).sort((a, b) => a.bank.localeCompare(b.bank, 'tr', { sensitivity: 'base' })); // Alfabetik sırala
  };

  const groupedCreditCards = groupCardsByBank(creditCards);
  const groupedCashAdvanceAccounts = groupCashAdvanceByBank(cashAdvanceAccounts);
  const groupedLoans = groupLoansByBank(loans);

  return (
    <div className="p-3 sm:p-6 w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Finansal Verilerim</h1>
        <p className="text-sm sm:text-base text-gray-600">Kredi kartları, ek hesapları ve kredilerinizi yönetin</p>
      </div>

      {/* Tabs - Mobile Responsive */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex overflow-x-auto sm:space-x-8 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-1 sm:space-x-2 py-2 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 sm:flex-none justify-center sm:justify-start ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                <span className="bg-gray-100 text-gray-600 py-0.5 px-1 sm:px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">

        {/* Content Area */}
        {/* Kredi Kartları */}
        {activeTab === 'creditCards' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Kredi Kartları</h2>
              <button 
                onClick={() => setShowCreditCardForm(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kart Ekle</span>
              </button>
            </div>

            {/* Kredi Kartı Özeti - Mobile Responsive */}
            {creditCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-orange-600 font-medium">Toplam Limit</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-900">{formatCurrency(totalCreditLimit)}</p>
                    </div>
                    <CreditCardIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-red-600 font-medium">Toplam Borç</p>
                      <p className="text-lg sm:text-xl font-bold text-red-900">{formatCurrency(totalCreditDebt)}</p>
                    </div>
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Borç Oranı</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900">%{totalCreditLimit > 0 ? Math.round((totalCreditDebt / totalCreditLimit) * 100) : 0}</p>
                    </div>
                    <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Kredi Kartı Grafikleri */}
            {creditCards.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Banka Dağılımı - Pie Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Banka Dağılımı</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={groupedCreditCards.map((group) => ({
                            name: getPlatformDisplayName(group.bank),
                            value: group.totalLimit,
                            count: group.cards.length
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {groupedCreditCards.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Limit vs Borç Karşılaştırması - Bar Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Limit vs Borç</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupedCreditCards.map(group => ({
                        name: getPlatformDisplayName(group.bank),
                        limit: group.totalLimit,
                        debt: group.totalDebt
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="limit" fill="#3B82F6" name="Limit" />
                        <Bar dataKey="debt" fill="#EF4444" name="Borç" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {creditCards.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                <CreditCardIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">Henüz kredi kartı eklenmemiş</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedCreditCards.map((bankGroup) => (
                  <div key={bankGroup.bank} className="bg-white rounded-lg p-4 sm:p-6 border border-blue-200">
                    {/* Banka Başlığı */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                          <CreditCardIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-blue-900">{getPlatformDisplayName(bankGroup.bank)}</h3>
                          <p className="text-sm text-blue-600">{bankGroup.cards.length} kart</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600 font-medium">Toplam Limit</p>
                        <p className="text-lg font-bold text-blue-900">{formatCurrency(bankGroup.totalLimit)}</p>
                      </div>
                    </div>
                    
                    {/* Kartlar Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {bankGroup.cards.map((card) => {
                  const debtRatio = calculateDebtRatio(card.currentDebt, card.limit);
                  const availableLimit = calculateAvailableLimit(card.limit, card.currentDebt);
                  
                  return (
                    <div key={card.id} className="bg-white border border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{card.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{card.bank}</p>
                          <p className="text-xs text-gray-500">**** {card.cardNumber}</p>
                        </div>
                        <div className="flex flex-row gap-1 ml-2">
                          <button 
                            onClick={() => {
                              setEditingCreditCard(card);
                              setShowCreditCardForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCreditCard(card.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3">
                            <span className="text-xs text-purple-700 font-semibold block mb-1">💳 Limit</span>
                            <span className="text-sm sm:text-lg font-bold text-purple-900">{formatCurrency(card.limit)}</span>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
                            <span className="text-xs text-red-700 font-semibold block mb-1">💸 Borç</span>
                            <span className="text-sm sm:text-lg font-bold text-red-900">{formatCurrency(card.currentDebt)}</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 sm:p-3">
                            <span className="text-xs text-emerald-700 font-semibold block mb-1">✅ Kullanılabilir</span>
                            <span className="text-sm sm:text-lg font-bold text-emerald-900">{formatCurrency(availableLimit)}</span>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                            <span className="text-xs text-amber-700 font-semibold block mb-1">📊 Borç Oranı</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm sm:text-lg font-bold ${
                                debtRatio > 80 ? 'text-red-600' : debtRatio > 50 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                %{Math.round(debtRatio)}
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    debtRatio > 80 ? 'bg-red-500' : debtRatio > 50 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(debtRatio, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t gap-1 sm:gap-0">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Kesim: {card.statementDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Vade: {card.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ek Hesapları */}
        {activeTab === 'cashAdvance' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Ek Hesapları</h2>
              <button 
                onClick={() => setShowCashAdvanceForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Hesap Ekle</span>
              </button>
            </div>

            {/* Ek Hesap Özeti */}
            {cashAdvanceAccounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Toplam Limit</p>
                      <p className="text-xl font-bold text-yellow-900">{formatCurrency(totalCashAdvanceLimit)}</p>
                    </div>
                    <Banknote className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Toplam Borç</p>
                      <p className="text-xl font-bold text-red-900">{formatCurrency(totalCashAdvanceDebt)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Borç Oranı</p>
                      <p className="text-xl font-bold text-orange-900">%{totalCashAdvanceLimit > 0 ? Math.round((totalCashAdvanceDebt / totalCashAdvanceLimit) * 100) : 0}</p>
                    </div>
                    <Percent className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Nakit Avans Grafikleri */}
            {cashAdvanceAccounts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Banka Dağılımı - Pie Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Banka Dağılımı</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={groupedCashAdvanceAccounts.map((group) => ({
                            name: getPlatformDisplayName(group.bank),
                            value: group.totalLimit,
                            count: group.accounts.length
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {groupedCashAdvanceAccounts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Limit vs Borç Karşılaştırması - Bar Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Limit vs Borç</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupedCashAdvanceAccounts.map(group => ({
                        name: getPlatformDisplayName(group.bank),
                        limit: group.totalLimit,
                        debt: group.totalDebt
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="limit" fill="#F59E0B" name="Limit" />
                        <Bar dataKey="debt" fill="#EF4444" name="Borç" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {cashAdvanceAccounts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz avans hesabı eklenmemiş</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedCashAdvanceAccounts).map(([bank, bankData]) => (
                  <div key={bank} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{getPlatformDisplayName(bank)}</h3>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>Toplam Limit: <span className="font-semibold text-purple-600">{formatCurrency(bankData.totalLimit)}</span></span>
                        <span>Toplam Borç: <span className="font-semibold text-red-600">{formatCurrency(bankData.totalDebt)}</span></span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bankData.accounts
                        .sort((a, b) => b.limit - a.limit)
                        .map((account) => {
                        const debtRatio = calculateDebtRatio(account.currentDebt, account.limit);
                        const availableLimit = calculateAvailableLimit(account.limit, account.currentDebt);
                        
                        return (
                          <div key={account.id} className="bg-white border border-purple-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{account.name}</h4>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => {
                                    setEditingCashAdvance(account);
                                    setShowCashAdvanceForm(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCashAdvance(account.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                                <span className="text-xs text-indigo-700 font-medium block mb-1">💰 Limit</span>
                                <span className="text-sm font-bold text-indigo-900">{formatCurrency(account.limit)}</span>
                              </div>
                              
                              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2">
                                <span className="text-xs text-rose-700 font-medium block mb-1">💸 Borç</span>
                                <span className="text-sm font-bold text-rose-900">{formatCurrency(account.currentDebt)}</span>
                              </div>
                              
                              <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
                                <span className="text-xs text-teal-700 font-medium block mb-1">✅ Uygun</span>
                                <span className="text-sm font-bold text-teal-900">{formatCurrency(availableLimit)}</span>
                              </div>
                              
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                                <span className="text-xs text-emerald-700 font-medium block mb-1">📈 Oran</span>
                                <span className={`text-sm font-bold ${
                                  (100 - debtRatio) >= 80 ? 'text-green-600' : (100 - debtRatio) >= 50 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  %{Math.round(100 - debtRatio)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Krediler */}
        {activeTab === 'loans' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Krediler</h2>
              <button 
                onClick={() => setShowLoanForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kredi Ekle</span>
              </button>
            </div>

            {/* Kredi Özeti */}
            {loans.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Toplam Kredi</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900">{formatCurrency(loans.reduce((sum, loan) => sum + loan.totalAmount, 0))}</p>
                    </div>
                    <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-red-600 font-medium">Kalan Borç</p>
                      <p className="text-lg sm:text-xl font-bold text-red-900">{formatCurrency(loans.reduce((sum, loan) => sum + loan.remainingAmount, 0))}</p>
                    </div>
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-blue-600 font-medium">Ödeme Oranı</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-900">%{loans.length > 0 ? Math.round(((loans.reduce((sum, loan) => sum + loan.totalAmount, 0) - loans.reduce((sum, loan) => sum + loan.remainingAmount, 0)) / loans.reduce((sum, loan) => sum + loan.totalAmount, 0)) * 100) : 0}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Kredi Grafikleri */}
            {loans.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Banka Dağılımı - Pie Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <PieChart className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Banka Dağılımı</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={groupedLoans.map((group) => ({
                            name: group.bank,
                            value: group.totalAmount,
                            count: group.loans.length
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {groupedLoans.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Toplam vs Kalan Karşılaştırması - Bar Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Toplam vs Kalan</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupedLoans.map(group => ({
                        name: group.bank,
                        total: group.totalAmount,
                        remaining: group.totalRemaining
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="total" fill="#10B981" name="Toplam" />
                        <Bar dataKey="remaining" fill="#EF4444" name="Kalan" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {loans.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz kredi eklenmemiş</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedLoans.map((bankGroup) => (
                  <div key={bankGroup.bank} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{getPlatformDisplayName(bankGroup.bank)}</h3>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>Toplam Tutar: <span className="font-semibold text-green-600">{formatCurrency(bankGroup.totalAmount)}</span></span>
                        <span>Kalan Borç: <span className="font-semibold text-red-600">{formatCurrency(bankGroup.totalRemaining)}</span></span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bankGroup.loans
                        .sort((a, b) => {
                          const progressA = calculateLoanProgress(a.totalInstallments, a.remainingInstallments);
                          const progressB = calculateLoanProgress(b.totalInstallments, b.remainingInstallments);
                          return progressB - progressA;
                        })
                        .map((loan) => {
                        const progress = calculateLoanProgress(loan.totalInstallments, loan.remainingInstallments);
                        
                        return (
                          <div key={loan.id} className="bg-white border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{loan.name}</h4>
                                <p className="text-xs text-gray-500">{LOAN_TYPES[loan.loanType]}</p>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => {
                                    setEditingLoan(loan);
                                    setShowLoanForm(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                <span className="text-xs text-purple-700 font-medium block mb-1">💰 Toplam</span>
                                <span className="text-sm font-bold text-purple-900">{formatCurrency(loan.totalAmount)}</span>
                              </div>
                              
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                <span className="text-xs text-red-700 font-medium block mb-1">💸 Kalan</span>
                                <span className="text-sm font-bold text-red-900">{formatCurrency(loan.remainingAmount)}</span>
                              </div>
                              
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                <span className="text-xs text-amber-700 font-medium block mb-1">📅 Aylık</span>
                                <span className="text-sm font-bold text-amber-900">{formatCurrency(loan.monthlyPayment)}</span>
                              </div>
                              
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                                <span className="text-xs text-emerald-700 font-medium block mb-1">📊 İlerleme</span>
                                <span className={`text-sm font-bold ${
                                  progress > 80 ? 'text-green-600' : progress > 50 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  %{progress}
                                </span>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                              <span className="text-xs text-blue-700 font-medium block mb-1">📊 Taksit</span>
                              <span className="text-sm font-bold text-blue-900">{loan.remainingInstallments}/{loan.totalInstallments}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Sonraki: {loan.nextPaymentDate.toLocaleDateString('tr-TR')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Percent className="w-3 h-3" />
                                <span>%{loan.interestRate}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Card Form Modal */}
      {showCreditCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg w-full mx-4 sm:mx-0 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <CreditCardIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingCreditCard ? 'Kredi Kartını Düzenle' : 'Yeni Kredi Kartı Ekle'}</h3>
                  <p className="text-sm text-gray-500">Kredi kartı bilgilerinizi girin</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowCreditCardForm(false);
                  setEditingCreditCard(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const parseNumber = (value: string | null) => {
                if (!value || typeof value !== 'string') return 0;
                // Boşlukları temizle ve virgülü noktaya çevir
                const cleanValue = value.trim().replace(/\s/g, '').replace(',', '.');
                const parsed = parseFloat(cleanValue);
                return isNaN(parsed) ? 0 : parsed;
              };
              handleAddCreditCard({
                name: formData.get('name'),
                bank: formData.get('bank'),
                cardNumber: formData.get('cardNumber'),
                limit: parseNumber(formData.get('limit') as string),
                currentDebt: parseNumber(formData.get('currentDebt') as string),
                statementDate: Number(formData.get('statementDate')),
                dueDate: Number(formData.get('dueDate')),
                annualFeeDate: formData.get('annualFeeDate') ? new Date(formData.get('annualFeeDate') as string) : null,
                isActive: true
              });
            }}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <CreditCardIcon className="w-4 h-4 text-blue-500" />
                      <span>Kart Adı</span>
                    </label>
                    <input 
                      name="name" 
                      placeholder="Örn: İş Bankası Platinum" 
                      defaultValue={editingCreditCard?.name || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Banknote className="w-4 h-4 text-green-500" />
                      <span>Banka</span>
                    </label>
                    <input 
                      name="bank" 
                      placeholder="Örn: İş Bankası" 
                      defaultValue={editingCreditCard?.bank || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Son 4 Hane</label>
                    <input 
                      name="cardNumber" 
                      placeholder="1234" 
                      defaultValue={editingCreditCard?.cardNumber || ''} 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white" 
                      maxLength={4}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-purple-500" />
                      <span>Toplam Limit</span>
                    </label>
                    <input 
                      name="limit" 
                      type="text" 
                      placeholder="50000" 
                      defaultValue={editingCreditCard?.limit || ''} 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>Kullanılabilir Limit</span>
                  </label>
                  <input 
                    name="availableLimit" 
                    type="text" 
                    placeholder="Kullanılabilir limit" 
                    defaultValue={editingCreditCard ? (editingCreditCard.limit - editingCreditCard.currentDebt).toString() : ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors bg-gray-50 focus:bg-white" 
                    required 
                    onChange={(e) => {
                      const availableLimitInput = e.target;
                      const limitInput = availableLimitInput.form?.querySelector('input[name="limit"]') as HTMLInputElement;
                      const currentDebtInput = availableLimitInput.form?.querySelector('input[name="currentDebt"]') as HTMLInputElement;
                      
                      if (limitInput && currentDebtInput) {
                        const totalLimit = parseFloat(limitInput.value.replace(',', '.')) || 0;
                        const availableLimit = parseFloat(availableLimitInput.value.replace(',', '.')) || 0;
                        const debt = totalLimit - availableLimit;
                        currentDebtInput.value = debt >= 0 ? debt.toString() : '0';
                      }
                    }}
                  />
                </div>
                <input name="currentDebt" type="hidden" defaultValue={editingCreditCard?.currentDebt || ''} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>Ekstre Günü</span>
                    </label>
                    <input 
                      name="statementDate" 
                      type="number" 
                      placeholder="15" 
                      min="1" 
                      max="31" 
                      defaultValue={editingCreditCard?.statementDate || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span>Son Ödeme Günü</span>
                    </label>
                    <input 
                      name="dueDate" 
                      type="number" 
                      placeholder="25" 
                      min="1" 
                      max="31" 
                      defaultValue={editingCreditCard?.dueDate || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>
                

                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    <span>Yıllık Aidat Tarihi</span>
                  </label>
                  <input 
                    name="annualFeeDate" 
                    type="date" 
                    defaultValue={editingCreditCard?.annualFeeDate ? (() => {
                      try {
                        const date = new Date(editingCreditCard.annualFeeDate);
                        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                      } catch {
                        return '';
                      }
                    })() : ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors bg-gray-50 focus:bg-white" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCardIcon className="w-5 h-5" />
                  <span>{editingCreditCard ? 'Kartı Güncelle' : 'Kartı Ekle'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreditCardForm(false);
                    setEditingCreditCard(null);
                  }} 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>İptal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Advance Form Modal */}
      {showCashAdvanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-lg w-full mx-4 sm:mx-0 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 text-white p-3 rounded-lg">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingCashAdvance ? 'Avans Hesabını Düzenle' : 'Yeni Avans Hesabı Ekle'}</h3>
                  <p className="text-sm text-gray-500">Nakit avans hesabı bilgilerinizi girin</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowCashAdvanceForm(false);
                  setEditingCashAdvance(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const parseNumber = (value: string | null) => {
                if (!value) return 0;
                return Number(value.replace(',', '.'));
              };
              handleAddCashAdvance({
                name: formData.get('name'),
                bank: formData.get('bank'),
                accountNumber: formData.get('accountNumber'),
                limit: parseNumber(formData.get('limit') as string),
                currentDebt: parseNumber(formData.get('currentDebt') as string),
                interestRate: parseNumber(formData.get('interestRate') as string),
                isActive: true
              });
            }}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Banknote className="w-4 h-4 text-green-500" />
                      <span>Hesap Adı</span>
                    </label>
                    <input 
                      name="name" 
                      placeholder="Örn: Nakit Avans Hesabı" 
                      defaultValue={editingCashAdvance?.name || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span className="text-blue-500">🏦</span>
                      <span>Banka</span>
                    </label>
                    <input 
                      name="bank" 
                      placeholder="Örn: Ziraat Bankası" 
                      defaultValue={editingCashAdvance?.bank || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    <span>Limit</span>
                  </label>
                  <input 
                    name="limit" 
                    type="text" 
                    placeholder="50000" 
                    defaultValue={editingCashAdvance?.limit || ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-colors bg-gray-50 focus:bg-white" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span className="text-red-500">💳</span>
                    <span>Mevcut Borç</span>
                  </label>
                  <input 
                    name="currentDebt" 
                    type="text" 
                    placeholder="15000" 
                    defaultValue={editingCashAdvance?.currentDebt || ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-colors bg-gray-50 focus:bg-white" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Banknote className="w-5 h-5" />
                  <span>{editingCashAdvance ? 'Hesabı Güncelle' : 'Hesabı Ekle'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCashAdvanceForm(false);
                    setEditingCashAdvance(null);
                  }} 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>İptal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Form Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-2xl w-full mx-4 sm:mx-0 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 text-white p-3 rounded-lg">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingLoan ? 'Krediyi Düzenle' : 'Yeni Kredi Ekle'}</h3>
                  <p className="text-sm text-gray-500">Kredi bilgilerinizi girin</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowLoanForm(false);
                  setEditingLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const parseNumber = (value: string | null) => {
                if (!value) return 0;
                return Number(value.replace(',', '.'));
              };
              const startDate = new Date(formData.get('startDate') as string);
              const totalInstallments = Number(formData.get('totalInstallments'));
              const remainingAmount = parseNumber(formData.get('remainingAmount') as string);
              const remainingInstallmentsInput = formData.get('remainingInstallments') as string;
              let remainingInstallments;
              
              // Eğer kalan borç 0 ise, kalan taksit sayısı da 0 olmalı
              if (remainingAmount === 0) {
                remainingInstallments = 0;
              } else {
                // Kalan taksit sayısı girilmişse onu kullan, yoksa toplam taksit sayısını kullan
                remainingInstallments = remainingInstallmentsInput ? Number(remainingInstallmentsInput) : totalInstallments;
              }
              const endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + totalInstallments);
              const nextPaymentDate = new Date(startDate);
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              
              handleAddLoan({
                name: formData.get('name'),
                bank: formData.get('bank'),
                loanType: formData.get('loanType'),
                totalAmount: parseNumber(formData.get('totalAmount') as string),
                remainingAmount: parseNumber(formData.get('remainingAmount') as string),
                monthlyPayment: parseNumber(formData.get('monthlyPayment') as string),
                interestRate: parseNumber(formData.get('interestRate') as string),
                totalInstallments: totalInstallments,
                remainingInstallments: remainingInstallments,
                startDate: startDate,
                endDate: endDate,
                nextPaymentDate: nextPaymentDate,
                isActive: true
              });
            }}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <PiggyBank className="w-4 h-4 text-purple-500" />
                      <span>Kredi Adı</span>
                    </label>
                    <input 
                      name="name" 
                      placeholder="Örn: İhtiyaç Kredisi" 
                      defaultValue={editingLoan?.name || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span className="text-blue-500">🏦</span>
                      <span>Banka</span>
                    </label>
                    <input 
                      name="bank" 
                      placeholder="Örn: Garanti BBVA" 
                      defaultValue={editingLoan?.bank || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span className="text-indigo-500">📋</span>
                    <span>Kredi Türü</span>
                  </label>
                  <select 
                    name="loanType" 
                    defaultValue={editingLoan?.loanType || ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors bg-gray-50 focus:bg-white" 
                    required
                  >
                    <option value="">Kredi Türü Seçin</option>
                    <option value="personal">Bireysel Kredi</option>
                    <option value="vehicle">Araç Kredisi</option>
                    <option value="housing">Konut Kredisi</option>
                    <option value="commercial">Ticari Kredi</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span>Toplam Tutar</span>
                    </label>
                    <input 
                      name="totalAmount" 
                      type="text" 
                      placeholder="100000" 
                      defaultValue={editingLoan?.totalAmount || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span className="text-red-500">💳</span>
                      <span>Kalan Borç</span>
                    </label>
                    <input 
                      name="remainingAmount" 
                      type="text" 
                      placeholder="75000" 
                      defaultValue={editingLoan?.remainingAmount || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                      onChange={(e) => {
                        const remainingAmountInput = e.target;
                        const remainingInstallmentsInput = remainingAmountInput.form?.querySelector('input[name="remainingInstallments"]') as HTMLInputElement;
                        if (remainingInstallmentsInput) {
                          const value = remainingAmountInput.value.replace(',', '.');
                          const amount = parseFloat(value) || 0;
                          if (amount === 0) {
                            remainingInstallmentsInput.value = '0';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>Aylık Ödeme</span>
                    </label>
                    <input 
                      name="monthlyPayment" 
                      type="text" 
                      placeholder="2500" 
                      defaultValue={editingLoan?.monthlyPayment || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-indigo-500" />
                      <span>Faiz Oranı (%)</span>
                    </label>
                    <input 
                      name="interestRate" 
                      type="text" 
                      step="0.01" 
                      placeholder="2.5" 
                      defaultValue={editingLoan?.interestRate || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors bg-gray-50 focus:bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span className="text-teal-500">#️⃣</span>
                      <span>Toplam Taksit</span>
                    </label>
                    <input 
                      name="totalInstallments" 
                      type="number" 
                      placeholder="48" 
                      defaultValue={editingLoan?.totalInstallments || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span className="text-amber-500">⏳</span>
                      <span>Kalan Taksit</span>
                    </label>
                    <input 
                      name="remainingInstallments" 
                      type="number" 
                      placeholder="36" 
                      defaultValue={editingLoan?.remainingInstallments || ''} 
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-colors bg-gray-50 focus:bg-white" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    <span>Başlangıç Tarihi</span>
                  </label>
                  <input 
                    name="startDate" 
                    type="date" 
                    defaultValue={editingLoan?.startDate ? (() => {
                      try {
                        const date = new Date(editingLoan.startDate);
                        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                      } catch {
                        return '';
                      }
                    })() : ''} 
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors bg-gray-50 focus:bg-white" 
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <PiggyBank className="w-5 h-5" />
                  <span>{editingLoan ? 'Krediyi Güncelle' : 'Krediyi Ekle'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLoanForm(false);
                    setEditingLoan(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>İptal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDataPage;