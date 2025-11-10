import React, { useState } from 'react';
import { Settings, User, Lock, Mail, Phone, Save, AlertCircle, CheckCircle, Shield, Trash2, LogOut, Database, ArrowLeft, Sun, Moon, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DataMigrationPanel } from '../../components/migration/DataMigrationPanel';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

type TabType = 'profile' | 'security' | 'appearance' | 'migration';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Görünüm</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Uygulama genelinde açık veya koyu tema seçin.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <span
            className={`${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform flex items-center justify-center`}
          >
            {theme === 'dark' ? <Moon size={12} className="text-gray-800" /> : <Sun size={12} className="text-yellow-500" />}
          </span>
        </button>
      </div>
    </div>
  );
};

export const SettingsPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [formData, setFormData] = useState({
    displayName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phoneNumber: user?.phoneNumbers?.[0]?.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'migration', label: 'Veri Aktarımı', icon: Database },
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await user.update({
        firstName: formData.displayName.split(' ')[0] || '',
        lastName: formData.displayName.split(' ').slice(1).join(' ') || ''
      });
      
      if (formData.phoneNumber && formData.phoneNumber !== user.phoneNumbers?.[0]?.phoneNumber) {
        // Placeholder for phone number update logic
      }
      
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
    setSuccess(null);
    try {
      await user.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500" placeholder="Ad Soyad" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="email" value={formData.email} disabled className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500" placeholder="Telefon Numarası" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-60">
              <Save size={18} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        );
      case 'security':
        return (
          <div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4 mb-8">
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={formData.currentPassword} onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500" placeholder="Mevcut Şifre" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={formData.newPassword} onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500" placeholder="Yeni Şifre" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500" placeholder="Yeni Şifreyi Onayla" />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-60">
                <Shield size={18} /> {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
            <div className="border-t pt-6 space-y-3 dark:border-gray-700">
               <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Hesap İşlemleri</h3>
               <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors">
                <LogOut size={18} /> Çıkış Yap
              </button>
              <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 rounded-lg font-semibold transition-colors">
                <Trash2 size={18} /> Hesabı Sil
              </button>
            </div>
          </div>
        );
      case 'appearance':
        return <ThemeToggleButton />;
      case 'migration':
        return (
          <DataMigrationPanel
            onMigrationComplete={(result) => {
              if (result.success) setSuccess('Veri aktarımı başarıyla tamamlandı!');
              else setError(result.message);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ayarlar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} /> <span>{success}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 mb-6">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    activeTab === tab.id ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-sm font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {loading ? <LoadingSpinner /> : renderTabContent()}
        </div>
      </main>
    </div>
  );
};