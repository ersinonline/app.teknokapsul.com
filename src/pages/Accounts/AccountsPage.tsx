import { useEffect, useMemo, useState } from 'react';
import { Landmark, Plus, FileText, TrendingUp, TrendingDown, CheckCircle, X, Building2, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlatformCredentialsByUserId, PlatformCredential } from '../../services/platformCredentials.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';

import { AccountsList } from '../../components/accounts/AccountsList';
import type { BankAccount, BankTransaction } from '../../types/bank';
import { createBankAccount, getBankAccounts, getTransactions, addTransactionsFromText, validateIban, formatAccountNumber, updateBankAccount } from '../../services/bank.service';

interface UploadProgress {
  accountId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export const AccountsPage = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [txByAccount, setTxByAccount] = useState<Record<string, BankTransaction[]>>({});
  const [loadingTx, setLoadingTx] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [form, setForm] = useState({ bankName: '', accountName: '', iban: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ bankName: '', accountName: '', iban: '' });

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [credData, bankData] = await Promise.all([
          getPlatformCredentialsByUserId(user.id),
          getBankAccounts(user.id),
        ]);
        setCredentials(credData);
        setBankAccounts(bankData);
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Kopyalandı!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setCopySuccess('Kopyalama başarısız!');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const canCreate = useMemo(() => {
    const hasName = form.bankName.trim().length > 1;
    const hasValidIban = !form.iban.trim() || validateIban(form.iban.trim());
    return hasName && hasValidIban;
  }, [form]);

  const handleCreateAccount = async () => {
    if (!user?.id || !canCreate) return;
    
    // IBAN validasyonu
    if (form.iban.trim() && !validateIban(form.iban.trim())) {
      setError('IBAN formatı geçersiz. TR ile başlamalı ve 26 karakter olmalıdır.');
      return;
    }
    
    setCreating(true);
    try {
      const created = await createBankAccount(user.id, {
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim(),
        iban: form.iban.trim(),
        accountNumber: form.iban.trim() ? formatAccountNumber(form.iban.trim()) : '',
      });
      setBankAccounts((prev) => [created, ...prev]);
      setForm({ bankName: '', accountName: '', iban: '' });
      setError(''); // Clear any previous errors
    } catch (e) {
      setError('Banka hesabı oluşturulurken hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  const handleTextInput = async (accountId: string, text: string, bankType: 'yapikredi' | 'garanti' = 'yapikredi') => {
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

      // Update local state
      const txs = await getTransactions(user.id, accountId);
      setTxByAccount((prev) => ({ ...prev, [accountId]: txs }));
      
      setUploadProgress({
        accountId,
        progress: 100,
        status: 'completed',
        message: `${transactions.length} işlem başarıyla eklendi.`
      });
      
      setTimeout(() => setUploadProgress(null), 3000);
    } catch (error) {
      console.error('Text processing error:', error);
      setUploadProgress({
        accountId,
        progress: 100,
        status: 'error',
        message: 'İşlemler eklenirken hata oluştu.'
      });
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  const handleShowTransactions = async (accountId: string) => {
    if (!user?.id) return;
    
    setLoadingTx(prev => ({ ...prev, [accountId]: true }));
    try {
      const txs = await getTransactions(user.id, accountId);
      setTxByAccount((prev) => ({ ...prev, [accountId]: txs }));
    } catch (e) {
      setError('İşlemler yüklenirken hata oluştu.');
    } finally {
      setLoadingTx(prev => ({ ...prev, [accountId]: false }));
    }
  };

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10 border-b mb-8">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Hesaplarım</h1>
                  <p className="text-sm text-gray-600">Banka hesaplarınızı yönetin ve işlemlerinizi takip edin</p>
                </div>
              </div>
              {copySuccess && (
                <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  {copySuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hesap Özeti Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Toplam Hesap Sayısı */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Hesap</p>
                <p className="text-xl font-bold text-gray-900">{bankAccounts.length}</p>
              </div>
            </div>
          </div>

          {/* Toplam İşlem Sayısı */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam İşlem</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(txByAccount).reduce((total, txs) => total + txs.length, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Toplam Gelir */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Gelir</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(txByAccount)
                    .flat()
                    .filter(tx => tx.type === 'credit')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
          </div>

          {/* Toplam Gider */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Gider</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(txByAccount)
                    .flat()
                    .filter(tx => tx.type === 'debit')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Hızlı İşlemler</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Para Transferi */}
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">Para Transferi</h4>
                <p className="text-xs text-gray-600">Hesaplar arası transfer</p>
              </div>
            </button>

            {/* Fatura Ödeme */}
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">Fatura Ödeme</h4>
                <p className="text-xs text-gray-600">Faturalarınızı ödeyin</p>
              </div>
            </button>

            {/* Gelir Ekle */}
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">Gelir Ekle</h4>
                <p className="text-xs text-gray-600">Hızlı gelir kaydı</p>
              </div>
            </button>

            {/* Gider Ekle */}
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm">Gider Ekle</h4>
                <p className="text-xs text-gray-600">Hızlı gider kaydı</p>
              </div>
            </button>
          </div>
        </div>

        {/* Bank Accounts Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Landmark className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Banka Hesaplarım</h2>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {bankAccounts.length} hesap
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Yeni Hesap
              </button>
            </div>

            {/* Add Account Form */}
            {showAddForm && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    Yeni Banka Hesabı Ekle
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banka Adı *
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Akbank, Ziraat, İş Bankası..."
                      value={form.bankName}
                      onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hesap Adı
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Maaş Hesabı, Birikim..."
                      value={form.accountName}
                      onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="TRxx xxxx xxxx xxxx xxxx xxxx xx"
                      value={form.iban}
                      onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCreateAccount}
                    disabled={!canCreate || creating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Hesap Ekle
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <AccountsList 
              credentials={credentials} 
              onCopy={handleCopy}
              bankAccounts={bankAccounts}
              txByAccount={txByAccount}
              loadingTx={loadingTx}
              uploadProgress={uploadProgress}
              editingAccount={editingAccount}
              editForm={editForm}
              onShowTransactions={handleShowTransactions}
              onTextInput={handleTextInput}
              onEditAccount={handleEditAccount}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              setEditForm={setEditForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};