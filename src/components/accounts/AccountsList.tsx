import React, { Dispatch, SetStateAction } from 'react';
import { PlatformCredential } from '../../services/platformCredentials.service';
import { AccountCard } from './AccountCard';
import { BankAccount, BankTransaction } from '../../types/bank';
import { Building2, Edit3, Save, X, FileText, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { deleteTransaction } from '../../services/bank.service';
import { useAuth } from '../../contexts/AuthContext';

interface UploadProgress {
  accountId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

interface AccountsListProps {
  credentials: PlatformCredential[];
  onCopy: (text: string) => void;
  bankAccounts?: BankAccount[];
  txByAccount?: Record<string, BankTransaction[]>;
  loadingTx?: Record<string, boolean>;
  uploadProgress?: UploadProgress | null;
  editingAccount?: string | null;
  editForm?: { bankName: string; accountName: string; iban: string };
  onShowTransactions?: (accountId: string) => void;
  onTextInput?: (accountId: string, text: string, bankType?: 'yapikredi' | 'garanti') => void;
  onEditAccount?: (account: BankAccount) => void;
  onSaveEdit?: (accountId: string) => void;
  onCancelEdit?: () => void;
  setEditForm?: Dispatch<SetStateAction<{ bankName: string; accountName: string; iban: string }>>;
}

export const AccountsList: React.FC<AccountsListProps> = ({ 
  credentials, 
  onCopy,
  bankAccounts = [],
  txByAccount = {},
  loadingTx = {},
  uploadProgress,
  editingAccount,
  editForm = { bankName: '', accountName: '', iban: '' },
  onShowTransactions,
  onTextInput,
  onEditAccount,
  onSaveEdit,
  onCancelEdit,
  setEditForm
}) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Bank Accounts */}
      {bankAccounts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <div className="p-4 bg-amber-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Henüz banka hesabı yok</h3>
          <p className="text-gray-600 mb-6">İlk banka hesabınızı ekleyerek başlayın</p>
        </div>
      ) : (
        bankAccounts.map((acc) => (
          <div key={acc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  {editingAccount === acc.id ? (
                    <div className="space-y-2">
                      <input
                        className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                        value={editForm.bankName}
                        onChange={(e) => setEditForm?.(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Banka Adı"
                      />
                      <input
                        className="text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none block"
                        value={editForm.accountName}
                        onChange={(e) => setEditForm?.(prev => ({ ...prev, accountName: e.target.value }))}
                        placeholder="Hesap Adı"
                      />
                      <input
                        className="text-xs text-gray-500 font-mono bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none block"
                        value={editForm.iban}
                        onChange={(e) => setEditForm?.(prev => ({ ...prev, iban: e.target.value }))}
                        placeholder="IBAN"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">{acc.bankName}</h3>
                      {acc.accountName && (
                        <p className="text-sm text-gray-600">{acc.accountName}</p>
                      )}
                      {acc.iban && (
                        <p className="text-xs text-gray-500 font-mono">{acc.iban}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingAccount === acc.id ? (
                  <>
                    <button
                      onClick={() => onSaveEdit?.(acc.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Kaydet
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <X className="h-4 w-4" />
                      İptal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEditAccount?.(acc)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Edit3 className="h-4 w-4" />
                    Düzenle
                  </button>
                )}
              </div>
            </div>

            {/* Text Input Area */}
            <div className="mb-6">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banka Seçimi
                </label>
                <select
                  id={`bank-select-${acc.id}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="yapikredi"
                  disabled={uploadProgress?.accountId === acc.id}
                >
                  <option value="yapikredi">Yapı Kredi Bankası</option>
                  <option value="garanti">Garanti Bankası</option>
                </select>
              </div>
              <textarea
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="İşlem verilerini buraya yapıştırın...&#10;Yapı Kredi örneği: 11/10/2025 00:41:43 Diğer Internet - Mobil INT 479794******3221 1110 4142 -750,00 TL 0,00 TL&#10;Garanti örneği: 16.10.2025 K.Kartı Ödeme 5499 **** **** 0015 Kart Ödemesi -79,52 TL 0,00 TL"
                disabled={uploadProgress?.accountId === acc.id}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (text.trim()) {
                    const selectElement = document.getElementById(`bank-select-${acc.id}`) as HTMLSelectElement;
                    const bankType = selectElement?.value as 'yapikredi' | 'garanti' || 'yapikredi';
                    onTextInput?.(acc.id, text, bankType);
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
                  onClick={() => onShowTransactions?.(acc.id)}
                  disabled={loadingTx[acc.id]}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {loadingTx[acc.id] ? (
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
            {uploadProgress?.accountId === acc.id && (
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
                      uploadProgress.status === 'error' 
                        ? 'bg-red-500' 
                        : uploadProgress.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {txByAccount[acc.id]?.length ? (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    İşlemler ({txByAccount[acc.id].length})
                  </h4>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tarih</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Açıklama</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tutar</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tip</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txByAccount[acc.id].map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {new Date(t.date).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {t.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            <span className={t.type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                              {t.type === 'debit' ? (
                                <ArrowDownRight className="inline h-4 w-4 mr-1" />
                              ) : (
                                <ArrowUpRight className="inline h-4 w-4 mr-1" />
                              )}
                              {t.type === 'debit' ? '-' : '+'}
                              {t.amount.toLocaleString('tr-TR', { 
                                style: 'currency', 
                                currency: t.currency || 'TRY' 
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              t.type === 'debit' 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {t.type === 'debit' ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : (
                                <TrendingUp className="h-3 w-3" />
                              )}
                              {t.type === 'debit' ? 'Giden' : 'Gelen'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <button
                              onClick={async () => {
                                if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
                                  try {
                                    await deleteTransaction(user!.uid, t.id);
                                    // Refresh transactions would be handled by parent component
                                  } catch (error) {
                                    console.error('İşlem silinirken hata oluştu:', error);
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                            >
                              <Trash2 className="h-3 w-3" />
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ))
      )}

      {/* Platform Credentials */}
      {credentials.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Platform Hesapları</h3>
              <p className="text-sm text-gray-600">Kayıtlı platform bilgileriniz</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {credentials.map((credential) => (
              <AccountCard
                key={credential.id}
                credential={credential}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};