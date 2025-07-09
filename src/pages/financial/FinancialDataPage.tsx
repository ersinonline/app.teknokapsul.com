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
  DollarSign
} from 'lucide-react';
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
        getCreditCards(user.uid),
        getCashAdvanceAccounts(user.uid),
        getLoans(user.uid)
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
        await deleteCreditCard(user!.uid, id);
        setCreditCards(prev => prev.filter(card => card.id !== id));
      } catch (error) {
        console.error('Error deleting credit card:', error);
      }
    }
  };

  const handleDeleteCashAdvance = async (id: string) => {
    if (window.confirm('Bu avans hesabını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCashAdvanceAccount(user!.uid, id);
        setCashAdvanceAccounts(prev => prev.filter(account => account.id !== id));
      } catch (error) {
        console.error('Error deleting cash advance account:', error);
      }
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (window.confirm('Bu krediyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteLoan(user!.uid, id);
        setLoans(prev => prev.filter(loan => loan.id !== id));
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  const handleAddCreditCard = async (formData: any) => {
    try {
      if (editingCreditCard) {
        await updateCreditCard(user!.uid, editingCreditCard.id, formData);
        setEditingCreditCard(null);
      } else {
        await addCreditCard(user!.uid, formData);
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
        await updateCashAdvanceAccount(user!.uid, editingCashAdvance.id, formData);
        setEditingCashAdvance(null);
      } else {
        await addCashAdvanceAccount(user!.uid, formData);
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
        await updateLoan(user!.uid, editingLoan.id, formData);
        setEditingLoan(null);
      } else {
        await addLoan(user!.uid, formData);
      }
      setShowLoanForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Kredi kaydedilirken bir hata oluştu.');
    }
  };

  const getDebtRatioColor = (availableRatio: number) => {
    if (availableRatio >= 80) return 'text-green-600';
    if (availableRatio >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (availableRatio: number) => {
    if (availableRatio >= 80) return 'bg-green-500';
    if (availableRatio >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const tabs = [
    { id: 'creditCards', label: 'Kredi Kartları', icon: CreditCardIcon, count: creditCards.length },
    { id: 'cashAdvance', label: 'Avans Hesapları', icon: Banknote, count: cashAdvanceAccounts.length },
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Finansal Verilerim</h1>
        <p className="text-gray-600">Kredi kartları, avans hesapları ve kredilerinizi yönetin</p>
      </div>



      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Kredi Kartları */}
        {activeTab === 'creditCards' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Kredi Kartları</h2>
              <button 
                onClick={() => setShowCreditCardForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Kart Ekle</span>
              </button>
            </div>

            {/* Kredi Kartı Özeti */}
            {creditCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Toplam Limit</p>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(totalCreditLimit)}</p>
                    </div>
                    <CreditCardIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Toplam Borç</p>
                      <p className="text-xl font-bold text-red-900">{formatCurrency(totalCreditDebt)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Borç Oranı</p>
                      <p className="text-xl font-bold text-green-900">%{totalCreditLimit > 0 ? Math.round((totalCreditDebt / totalCreditLimit) * 100) : 0}</p>
                    </div>
                    <Percent className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {creditCards.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz kredi kartı eklenmemiş</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditCards
                  .sort((a, b) => {
                    const availableRatioA = ((a.limit - a.currentDebt) / a.limit) * 100;
                    const availableRatioB = ((b.limit - b.currentDebt) / b.limit) * 100;
                    return availableRatioA - availableRatioB;
                  })
                  .map((card) => {
                  const debtRatio = calculateDebtRatio(card.currentDebt, card.limit);
                  const availableLimit = calculateAvailableLimit(card.limit, card.currentDebt);
                  
                  return (
                    <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{card.name}</h3>
                          <p className="text-sm text-gray-600">{card.bank}</p>
                          <p className="text-xs text-gray-500">**** {card.cardNumber}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setEditingCreditCard(card);
                              setShowCreditCardForm(true);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCreditCard(card.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Limit</span>
                          <span className="font-medium">{formatCurrency(card.limit)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Borç</span>
                          <span className="font-medium text-red-600">{formatCurrency(card.currentDebt)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Kullanılabilir</span>
                          <span className="font-medium text-green-600">{formatCurrency(availableLimit)}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Kullanılabilir Oran</span>
                            <span className={`font-medium ${getDebtRatioColor(100 - debtRatio)}`}>
                              %{100 - debtRatio}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(100 - debtRatio)}`}
                              style={{ width: `${Math.min(100 - debtRatio, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Kesim: {card.statementDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Vade: {card.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Avans Hesapları */}
        {activeTab === 'cashAdvance' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Avans Hesapları</h2>
              <button 
                onClick={() => setShowCashAdvanceForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Hesap Ekle</span>
              </button>
            </div>

            {/* Avans Hesap Özeti */}
            {cashAdvanceAccounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Toplam Limit</p>
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(totalCashAdvanceLimit)}</p>
                    </div>
                    <Banknote className="w-8 h-8 text-purple-500" />
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

            {cashAdvanceAccounts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz avans hesabı eklenmemiş</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cashAdvanceAccounts
                  .sort((a, b) => {
                    const availableRatioA = ((a.limit - a.currentDebt) / a.limit) * 100;
                    const availableRatioB = ((b.limit - b.currentDebt) / b.limit) * 100;
                    return availableRatioA - availableRatioB;
                  })
                  .map((account) => {
                  const debtRatio = calculateDebtRatio(account.currentDebt, account.limit);
                  const availableLimit = calculateAvailableLimit(account.limit, account.currentDebt);
                  
                  return (
                    <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.name}</h3>
                          <p className="text-sm text-gray-600">{account.bank}</p>
                          <p className="text-xs text-gray-500">**** {account.accountNumber}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setEditingCashAdvance(account);
                              setShowCashAdvanceForm(true);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCashAdvance(account.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Limit</span>
                          <span className="font-medium">{formatCurrency(account.limit)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Borç</span>
                          <span className="font-medium text-red-600">{formatCurrency(account.currentDebt)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Kullanılabilir</span>
                          <span className="font-medium text-green-600">{formatCurrency(availableLimit)}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Kullanılabilir Oran</span>
                            <span className={`font-medium ${getDebtRatioColor(100 - debtRatio)}`}>
                              %{100 - debtRatio}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(100 - debtRatio)}`}
                              style={{ width: `${Math.min(100 - debtRatio, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Percent className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">Faiz: %{account.interestRate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

            {loans.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz kredi eklenmemiş</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loans.map((loan) => {
                  const progress = calculateLoanProgress(loan.totalInstallments, loan.remainingInstallments);
                  
                  return (
                    <div key={loan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{loan.name}</h3>
                          <p className="text-sm text-gray-600">{loan.bank}</p>
                          <p className="text-xs text-gray-500">{LOAN_TYPES[loan.loanType]}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setEditingLoan(loan);
                              setShowLoanForm(true);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLoan(loan.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Toplam Tutar</span>
                          <span className="font-medium">{formatCurrency(loan.totalAmount)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Kalan Borç</span>
                          <span className="font-medium text-red-600">{formatCurrency(loan.remainingAmount)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Aylık Ödeme</span>
                          <span className="font-medium">{formatCurrency(loan.monthlyPayment)}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">İlerleme</span>
                            <span className="font-medium text-blue-600">%{progress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Kalan Taksit</span>
                          <span className="font-medium">{loan.remainingInstallments}/{loan.totalInstallments}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              Sonraki: {loan.nextPaymentDate.toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Percent className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600">%{loan.interestRate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Card Form Modal */}
      {showCreditCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">{editingCreditCard ? 'Kredi Kartını Düzenle' : 'Yeni Kredi Kartı Ekle'}</h3>
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
                minimumPayment: parseNumber(formData.get('minimumPayment') as string),
                interestRate: parseNumber(formData.get('interestRate') as string),
                annualFeeDate: formData.get('annualFeeDate') ? new Date(formData.get('annualFeeDate') as string) : null,
                isActive: true
              });
            }}>
              <div className="space-y-4">
                <input name="name" placeholder="Kart Adı" defaultValue={editingCreditCard?.name || ''} className="w-full p-2 border rounded" required />
                <input name="bank" placeholder="Banka" defaultValue={editingCreditCard?.bank || ''} className="w-full p-2 border rounded" required />
                <input name="cardNumber" placeholder="Son 4 Hane" defaultValue={editingCreditCard?.cardNumber || ''} className="w-full p-2 border rounded" required />
                <input name="limit" type="text" placeholder="Limit" defaultValue={editingCreditCard?.limit || ''} className="w-full p-2 border rounded" required />
                <input name="currentDebt" type="text" placeholder="Mevcut Borç" defaultValue={editingCreditCard?.currentDebt || ''} className="w-full p-2 border rounded" />
                <input name="statementDate" type="number" placeholder="Ekstre Günü (1-31)" defaultValue={editingCreditCard?.statementDate || ''} className="w-full p-2 border rounded" required />
                <input name="dueDate" type="number" placeholder="Son Ödeme Günü (1-31)" defaultValue={editingCreditCard?.dueDate || ''} className="w-full p-2 border rounded" required />
                <input name="minimumPayment" type="text" placeholder="Minimum Ödeme" defaultValue={editingCreditCard?.minimumPayment || ''} className="w-full p-2 border rounded" />
                <input name="interestRate" type="text" step="0.01" placeholder="Faiz Oranı (%)" defaultValue={editingCreditCard?.interestRate || ''} className="w-full p-2 border rounded" />
                <input name="annualFeeDate" type="date" placeholder="Yıllık Aidat Tarihi" defaultValue={editingCreditCard?.annualFeeDate ? new Date(editingCreditCard.annualFeeDate).toISOString().split('T')[0] : ''} className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Ekle</button>
                <button type="button" onClick={() => {
                  setShowCreditCardForm(false);
                  setEditingCreditCard(null);
                }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Advance Form Modal */}
      {showCashAdvanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">{editingCashAdvance ? 'Avans Hesabını Düzenle' : 'Yeni Avans Hesabı Ekle'}</h3>
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
              <div className="space-y-4">
                <input name="name" placeholder="Hesap Adı" defaultValue={editingCashAdvance?.name || ''} className="w-full p-2 border rounded" required />
                <input name="bank" placeholder="Banka" defaultValue={editingCashAdvance?.bank || ''} className="w-full p-2 border rounded" required />
                <input name="accountNumber" placeholder="Son 4 Hane" defaultValue={editingCashAdvance?.accountNumber || ''} className="w-full p-2 border rounded" required />
                <input name="limit" type="text" placeholder="Limit" defaultValue={editingCashAdvance?.limit || ''} className="w-full p-2 border rounded" required />
                <input name="currentDebt" type="text" placeholder="Mevcut Borç" defaultValue={editingCashAdvance?.currentDebt || ''} className="w-full p-2 border rounded" />
                <input name="interestRate" type="text" step="0.01" placeholder="Faiz Oranı (%)" defaultValue={editingCashAdvance?.interestRate || ''} className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Ekle</button>
                <button type="button" onClick={() => {
                  setShowCashAdvanceForm(false);
                  setEditingCashAdvance(null);
                }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Form Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">{editingLoan ? 'Krediyi Düzenle' : 'Yeni Kredi Ekle'}</h3>
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
              <div className="space-y-4">
                <input name="name" placeholder="Kredi Adı" defaultValue={editingLoan?.name || ''} className="w-full p-2 border rounded" required />
                <input name="bank" placeholder="Banka" defaultValue={editingLoan?.bank || ''} className="w-full p-2 border rounded" required />
                <select name="loanType" defaultValue={editingLoan?.loanType || ''} className="w-full p-2 border rounded" required>
                  <option value="">Kredi Türü Seçin</option>
                  <option value="personal">Bireysel Kredi</option>
                  <option value="vehicle">Araç Kredisi</option>
                  <option value="housing">Konut Kredisi</option>
                  <option value="commercial">Ticari Kredi</option>
                  <option value="other">Diğer</option>
                </select>
                <input name="totalAmount" type="text" placeholder="Toplam Tutar" defaultValue={editingLoan?.totalAmount || ''} className="w-full p-2 border rounded" required />
                <input 
                  name="remainingAmount" 
                  type="text" 
                  placeholder="Kalan Borç" 
                  defaultValue={editingLoan?.remainingAmount || ''} 
                  className="w-full p-2 border rounded" 
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
                <input name="monthlyPayment" type="text" placeholder="Aylık Ödeme" defaultValue={editingLoan?.monthlyPayment || ''} className="w-full p-2 border rounded" required />
                <input name="totalInstallments" type="number" placeholder="Toplam Taksit Sayısı" defaultValue={editingLoan?.totalInstallments || ''} className="w-full p-2 border rounded" required />
                <input name="remainingInstallments" type="number" placeholder="Kalan Taksit Sayısı" defaultValue={editingLoan?.remainingInstallments || ''} className="w-full p-2 border rounded" required />
                <input name="interestRate" type="text" step="0.01" placeholder="Faiz Oranı (%)" defaultValue={editingLoan?.interestRate || ''} className="w-full p-2 border rounded" />
                <input name="startDate" type="date" placeholder="Başlangıç Tarihi" defaultValue={editingLoan?.startDate ? new Date(editingLoan.startDate).toISOString().split('T')[0] : ''} className="w-full p-2 border rounded" required />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Ekle</button>
                <button type="button" onClick={() => {
                  setShowLoanForm(false);
                  setEditingLoan(null);
                }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};