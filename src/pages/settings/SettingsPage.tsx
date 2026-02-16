import React, { useState } from 'react';
import { Settings, User, Lock, Mail, Phone, Save, AlertCircle, CheckCircle, Shield, Trash2, LogOut, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DataMigrationPanel } from '../../components/migration/DataMigrationPanel';
import { updateProfile } from 'firebase/auth';



type TabType = 'profile' | 'security' | 'migration';

export const SettingsPage = () => {
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User, color: 'text-blue-600' },
    { id: 'security', label: 'Güvenlik', icon: Shield, color: 'text-green-600' },
    { id: 'migration', label: 'Veri Aktarımı', icon: Database, color: 'text-purple-600' },
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Firebase kullanıcı profilini güncelle
      await updateProfile(user, {
        displayName: formData.displayName
      });
      
      setSuccess('Profil başarıyla güncellendi.');
    } catch (err) {
      setError('Profil güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Google ile giriş yapıldığında şifre güncellenemez
      throw new Error('Google ile giriş yapıldığında şifre değiştirilemez.');
      
      setSuccess('Şifre başarıyla güncellendi.');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError('Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError('Çıkış yapılırken bir hata oluştu.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setError('Hesap silme özelliği henüz aktif değil. Lütfen destek ile iletişime geçin.');
    }
  };



  if (loading) return <LoadingSpinner />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Telefon numaranızı girin"
                  />
                </div>
                {!formData.phoneNumber && (
                  <p className="text-xs text-gray-500 mt-1">Telefon numarası ekleyebilirsiniz</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
              </button>
            </form>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Mevcut şifrenizi girin"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Yeni şifrenizi girin"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                style={{ backgroundColor: '#ffb700' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
            
            {/* Account Actions */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hesap İşlemleri</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Hesabı Sil
                </button>
              </div>
            </div>
          </div>
        );
      case 'migration':
        return (
          <div className="space-y-6">
            <DataMigrationPanel 
              onMigrationComplete={(result) => {
                if (result.success) {
                  setSuccess('Veri aktarımı başarıyla tamamlandı!');
                } else {
                  setError(result.message);
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ayarlar</h1>
              <p className="text-white/60 text-xs">Hesap ve uygulama ayarları</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
          {/* Alert Messages */}
          {error && (
            <div className="bank-card p-3 flex items-center gap-2 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}
          {success && (
            <div className="bank-card p-3 flex items-center gap-2 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-600">{success}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="bank-card p-1.5">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="bank-card p-4">
            {renderTabContent()}
          </div>
      </div>
    </div>
  );
};