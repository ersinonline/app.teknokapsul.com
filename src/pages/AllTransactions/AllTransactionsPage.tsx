import { useEffect, useState } from 'react';
import { TrendingUp, Building2, Filter, Search, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Wallet, Plus, ChevronDown, ChevronUp, X, Edit, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getBankAccounts, getTransactions, addTransactionsFromText, createBankAccount, validateIban, formatAccountNumber, updateBankAccount, deleteBankAccount } from '../../services/bank.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import type { BankAccount, BankTransaction } from '../../types/bank';

interface TransactionWithAccount extends BankTransaction {
  bankName: string;
  accountName: string;
}

interface UploadProgress {
  accountId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export const AllTransactionsPage = () => {
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState<TransactionWithAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  // Yeni state'ler
  const [showAccountsPanel, setShowAccountsPanel] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankType: 'yapikredi' as 'yapikredi' | 'garanti' | 'akbank' | 'teb',
    accountName: '',
    iban: ''
  });
  
  // İşlem ekleme için yeni state'ler
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [loadingTx, setLoadingTx] = useState<Record<string, boolean>>({});
  
  // Düzenleme için yeni state'ler
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    bankName: '',
    accountName: '',
    iban: ''
  });

  // Banka adından banka tipini algılayan fonksiyon
  const detectBankType = (bankName: string): 'yapikredi' | 'garanti' | 'akbank' | 'teb' => {
    const normalizedName = bankName.toLowerCase().trim();
    
    // Yapı Kredi varyasyonları
    if (normalizedName.includes('yapı kredi') || 
        normalizedName.includes('yapıkredi') || 
        normalizedName.includes('yapikredi') ||
        normalizedName.includes('yapı ve kredi') ||
        normalizedName.includes('yapı kredi bankası')) {
      return 'yapikredi';
    }
    
    // Garanti varyasyonları
    if (normalizedName.includes('garanti') ||
        normalizedName.includes('garantibbva') ||
        normalizedName.includes('garanti bbva') ||
        normalizedName.includes('garanti bankası') ||
        normalizedName.includes('türkiye garanti bankası')) {
      return 'garanti';
    }
    
    // Akbank varyasyonları
    if (normalizedName.includes('akbank') ||
        normalizedName.includes('ak bank') ||
        normalizedName.includes('akbank t.a.ş.')) {
      return 'akbank';
    }
    
    // TEB varyasyonları
    if (normalizedName.includes('teb') ||
        normalizedName.includes('türk ekonomi bankası') ||
        normalizedName.includes('türk ekonomi') ||
        normalizedName.includes('cepteteb')) {
      return 'teb';
    }
    
    // Varsayılan olarak Yapı Kredi döndür
    return 'yapikredi';
  };

  // Tüm işlemleri yeniden yükleyen fonksiyon
  const fetchAllTransactions = async () => {
    if (!user?.id) return;
    
    try {
      const accountsData = await getBankAccounts(user.id);
      setBankAccounts(accountsData);

      const allTxs: TransactionWithAccount[] = [];
      
      for (const account of accountsData) {
        try {
          const accountTxs = await getTransactions(user.id, account.id);
          const txsWithAccount = accountTxs.map((tx: BankTransaction) => ({
            ...tx,
            bankName: account.bankName,
            accountName: account.accountName || 'Ana Hesap'
          }));
          allTxs.push(...txsWithAccount);
        } catch (err) {
          console.error(`Error fetching transactions for account ${account.id}:`, err);
        }
      }

      allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllTransactions(allTxs);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu.');
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        await fetchAllTransactions();
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Filtreleme fonksiyonu
  const filteredTransactions = allTransactions.filter(tx => {
    // Arama filtresi
    if (searchTerm && !tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tx.bankName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Hesap filtresi
    if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) {
      return false;
    }

    // Tip filtresi
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }

    // Tutar filtresi
    if (minAmount && tx.amount < parseFloat(minAmount)) {
      return false;
    }
    if (maxAmount && tx.amount > parseFloat(maxAmount)) {
      return false;
    }

    // Tarih filtresi
    if (dateRange !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          if (txDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (txDate < monthAgo) return false;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          if (txDate < yearAgo) return false;
          break;
      }
    }

    return true;
  });

  // Sıralama
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  // İstatistikler
  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Grafik verileri
  const chartData = [
    { name: 'Gelir', value: totalIncome, color: '#10b981', count: filteredTransactions.filter(tx => tx.type === 'credit').length },
    { name: 'Gider', value: totalExpense, color: '#ef4444', count: filteredTransactions.filter(tx => tx.type === 'debit').length }
  ];

  // Aylık trend verileri
  const monthlyData = filteredTransactions.reduce((acc, tx) => {
    const month = new Date(tx.date).toLocaleDateString('tr-TR', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { month, income: 0, expense: 0 };
    }
    if (tx.type === 'credit') {
      acc[month].income += tx.amount;
    } else {
      acc[month].expense += tx.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; income: number; expense: number }>);

  const monthlyChartData = Object.values(monthlyData);

  // İşlem ekleme fonksiyonu
  const handleTextInput = async (accountId: string, text: string, bankType: 'yapikredi' | 'garanti' | 'akbank' | 'teb') => {
    if (!user?.id || !text.trim()) return;
    
    setUploadProgress({
      accountId,
      progress: 0,
      status: 'processing',
      message: 'Metin işleniyor ve işlemler çıkarılıyor...'
    });

    try {
      // Parse and add transactions using the service function
      const transactions = await addTransactionsFromText(user.id, accountId, text, bankType);
      
      if (transactions.length === 0) {
        setUploadProgress({
          accountId,
          progress: 100,
          status: 'error',
          message: 'Metinde geçerli işlem bulunamadı.'
        });
        setTimeout(() => setUploadProgress(null), 3000);
        return;
      }

      // Tüm işlemleri yeniden yükle
      await fetchAllTransactions();
      
      setUploadProgress({
        accountId,
        progress: 100,
        status: 'completed',
        message: `${transactions.length} işlem başarıyla eklendi.`
      });
      
      setTimeout(() => setUploadProgress(null), 3000);
    } catch (error) {
      console.error('Error processing text:', error);
      setUploadProgress({
        accountId,
        progress: 100,
        status: 'error',
        message: 'İşlemler eklenirken hata oluştu.'
      });
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  // Hesap düzenleme fonksiyonları
  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account.id);
    setEditForm({
      bankName: account.bankName,
      accountName: account.accountName || '',
      iban: account.iban || ''
    });
  };

  const handleSaveEdit = async (accountId: string) => {
    if (!user?.id) return;
    
    // IBAN validasyonu
    if (editForm.iban.trim() && !validateIban(editForm.iban.trim())) {
      setError('IBAN formatı geçersiz. TR ile başlamalı ve 26 karakter olmalıdır.');
      return;
    }

    try {
      // Veritabanında güncelle
      await updateBankAccount(user.id, accountId, {
        bankName: editForm.bankName.trim(),
        accountName: editForm.accountName.trim(),
        iban: editForm.iban.trim(),
        accountNumber: editForm.iban.trim() ? formatAccountNumber(editForm.iban.trim()) : ''
      });

      // Local state'i güncelle
      setBankAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { 
              ...acc, 
              bankName: editForm.bankName.trim(),
              accountName: editForm.accountName.trim(),
              iban: editForm.iban.trim(),
              accountNumber: editForm.iban.trim() ? formatAccountNumber(editForm.iban.trim()) : ''
            }
          : acc
      ));
      setEditingAccount(null);
      setError('');
    } catch (e) {
      setError('Hesap güncellenirken hata oluştu.');
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditForm({ bankName: '', accountName: '', iban: '' });
  };

  // Hesap silme fonksiyonu
  const handleDeleteAccount = async (accountId: string) => {
    if (!user?.id) return;
    
    if (!window.confirm('Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve hesaba ait tüm işlemler de silinecektir.')) {
      return;
    }

    try {
      // Hesabı ve ilgili işlemleri sil
      await deleteBankAccount(user.id, accountId);
      
      // Local state'i güncelle
      setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setAllTransactions(prev => prev.filter(tx => tx.accountId !== accountId));
      
      setError('');
    } catch (e) {
      setError('Hesap silinirken hata oluştu.');
    }
  };

  // İşlemleri göster fonksiyonu
  const handleShowTransactions = async (accountId: string) => {
    setLoadingTx(prev => ({ ...prev, [accountId]: true }));
    
    try {
      // Bu fonksiyon zaten mevcut işlemleri gösteriyor, sadece loading state'ini yönetiyoruz
      setTimeout(() => {
        setLoadingTx(prev => ({ ...prev, [accountId]: false }));
      }, 1000);
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
      setLoadingTx(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleAddAccount = async () => {
    if (!user?.id || !newAccount.accountName.trim() || !newAccount.iban.trim()) {
      return;
    }

    try {
      const bankName = newAccount.bankType === 'yapikredi' ? 'Yapı Kredi Bankası' : 
                       newAccount.bankType === 'garanti' ? 'Garanti Bankası' : 
                       newAccount.bankType === 'akbank' ? 'Akbank' : 'TEB';
      
      await createBankAccount(user.id, {
        bankName,
        accountName: newAccount.accountName,
        iban: newAccount.iban,
        accountNumber: formatAccountNumber(newAccount.iban)
      });

      // Hesapları yeniden yükle
      const accounts = await getBankAccounts(user.id);
      setBankAccounts(accounts);

      setShowAddAccountModal(false);
      setNewAccount({
        bankType: 'yapikredi',
        accountName: '',
        iban: ''
      });
    } catch (error) {
      console.error('Hesap ekleme hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Hesaplarım & İşlemler</h1>
            </div>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Hesap Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4 space-y-6">
        
        {/* İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gider</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Durum</p>
                <p className={`text-xl sm:text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(totalIncome - totalExpense).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hesaplarım Şeridi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setShowAccountsPanel(!showAccountsPanel)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Hesaplarım</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                {bankAccounts.length}
              </span>
            </div>
            {showAccountsPanel ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showAccountsPanel && (
            <div className="border-t border-gray-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-6">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    {/* Hesap Bilgileri */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            {editingAccount === account.id ? (
                              <div className="space-y-2">
                                <input
                                  className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                                  value={editForm.bankName}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                                  placeholder="Banka Adı"
                                />
                                <input
                                  className="text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none block"
                                  value={editForm.accountName}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, accountName: e.target.value }))}
                                  placeholder="Hesap Adı"
                                />
                                <input
                                  className="text-xs text-gray-500 font-mono bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none block"
                                  value={editForm.iban}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, iban: e.target.value }))}
                                  placeholder="IBAN"
                                />
                              </div>
                            ) : (
                              <>
                                <h4 className="font-medium text-gray-900">{account.bankName}</h4>
                                <p className="text-sm text-gray-600">{account.accountName || 'Ana Hesap'}</p>
                                <p className="text-xs text-gray-500 font-mono">{account.accountNumber}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        {editingAccount === account.id ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(account.id)}
                              className="text-green-600 hover:text-green-800 text-sm p-2 rounded-lg hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditAccount(account)}
                              className="text-blue-600 hover:text-blue-800 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-800 text-sm p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* İşlem Ekleme Alanı */}
                    <div className="mb-4">
                      <textarea
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="İşlem verilerini buraya yapıştırın...&#10;Örnek: 11/10/2025 00:41:43 Diğer Internet - Mobil INT 479794******3221 1110 4142 -750,00 TL 0,00 TL"
                        disabled={uploadProgress?.accountId === account.id}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData('text');
                          if (text.trim()) {
                            const bankType = detectBankType(account.bankName);
                            handleTextInput(account.id, text, bankType);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="h-3 w-3" />
                          <span>İşlem verilerini yapıştırın ve otomatik olarak ayrıştırılsın</span>
                        </div>
                        <button
                          onClick={() => handleShowTransactions(account.id)}
                          disabled={loadingTx[account.id]}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          {loadingTx[account.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Yükleniyor...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4" />
                              İşlemleri Göster
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress?.accountId === account.id && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {uploadProgress.status === 'uploading' && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                            {uploadProgress.status === 'processing' && (
                              <div className="animate-pulse h-4 w-4 bg-yellow-400 rounded-full"></div>
                            )}
                            {uploadProgress.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {uploadProgress.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {uploadProgress.message}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            %{uploadProgress.progress}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              uploadProgress.status === 'completed' ? 'bg-green-500' :
                              uploadProgress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${uploadProgress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Hesap İstatistikleri */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      {(() => {
                        const accountTransactions = allTransactions.filter(tx => tx.accountId === account.id);
                        const accountIncome = accountTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
                        const accountExpense = accountTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
                        
                        return (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">İşlem</p>
                              <p className="text-sm font-semibold text-gray-900">{accountTransactions.length}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Gelir</p>
                              <p className="text-sm font-semibold text-green-600">
                                {accountIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Gider</p>
                              <p className="text-sm font-semibold text-red-600">
                                {accountExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Arama */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="İşlem açıklaması veya banka adı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
            
            {/* Hesap Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hesap</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                <option value="all">Tüm Hesaplar</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} - {account.accountName || 'Ana Hesap'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tip Filtresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">İşlem Tipi</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Tüm İşlemler</option>
                <option value="credit">Gelen</option>
                <option value="debit">Giden</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showChart 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              {showChart ? 'Grafikleri Gizle' : 'Grafikleri Göster'}
            </button>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAccount('all');
                setSelectedType('all');
                setDateRange('all');
                setMinAmount('');
                setMaxAmount('');
                setSortBy('date');
                setSortOrder('desc');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>

        {/* Grafikler */}
        {showChart && filteredTransactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PieChart className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gelir/Gider Dağılımı</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Aylık Trend</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        `${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
                        name === 'income' ? 'Gelir' : 'Gider'
                      ]}
                    />
                    <Bar dataKey="income" fill="#10b981" name="income" />
                    <Bar dataKey="expense" fill="#ef4444" name="expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* İşlemler Tablosu */}
        {sortedTransactions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">İşlem Listesi</h3>
              <p className="text-sm text-gray-600 mt-1">{sortedTransactions.length} işlem bulundu</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banka / Hesap
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Açıklama
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Tip
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.map((tx) => (
                    <tr key={`${tx.accountId}-${tx.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {new Date(tx.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                              {tx.bankName}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">
                              {tx.accountName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs truncate hidden sm:table-cell">
                        {tx.description || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={tx.type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                          {tx.type === 'debit' ? '-' : '+'}
                          {tx.amount.toLocaleString('tr-TR', { 
                            style: 'currency', 
                            currency: tx.currency || 'TRY' 
                          })}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'debit' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {tx.type === 'debit' ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {tx.type === 'debit' ? 'Giden' : 'Gelen'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="İşlem bulunamadı"
            description="Seçilen kriterlere uygun işlem bulunmuyor."
          />
        )}
      </div>

      {/* Hesap Ekleme Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Hesap Ekle</h2>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banka Seçimi
                </label>
                <select
                  value={newAccount.bankType}
                  onChange={(e) => setNewAccount({...newAccount, bankType: e.target.value as 'yapikredi' | 'garanti' | 'akbank' | 'teb'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yapikredi">Yapı Kredi Bankası</option>
                  <option value="garanti">Garanti Bankası</option>
                  <option value="akbank">Akbank</option>
                  <option value="teb">TEB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hesap Adı
                </label>
                <input
                  type="text"
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Ana Hesap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={newAccount.iban}
                  onChange={(e) => setNewAccount({...newAccount, iban: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Hesap Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };