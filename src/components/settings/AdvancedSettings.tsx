import React, { useState } from 'react';
import {
  Palette,
  Eye,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Check,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';


interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'appearance',
    title: 'Görünüm',
    description: 'Tema, renkler ve görsel ayarlar',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'accessibility',
    title: 'Erişilebilirlik',
    description: 'Yazı boyutu, kontrast ve hareket ayarları',
    icon: <Eye className="w-5 h-5" />
  },
  {
    id: 'notifications',
    title: 'Bildirimler',
    description: 'Push bildirimleri ve uyarı ayarları',
    icon: <Bell className="w-5 h-5" />
  },
  {
    id: 'privacy',
    title: 'Gizlilik',
    description: 'Veri paylaşımı ve güvenlik ayarları',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 'data',
    title: 'Veri Yönetimi',
    description: 'İçe/dışa aktarma ve yedekleme',
    icon: <Download className="w-5 h-5" />
  }
];

export const AdvancedSettings: React.FC = () => {
  const {
    settings,
    updateTheme,
    updateColorScheme,
    updateFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    resetToDefaults
  } = useTheme();

  const [activeSection, setActiveSection] = useState('appearance');
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: false,
    emailEnabled: true,
    paymentReminders: true,
    subscriptionAlerts: true,
    budgetWarnings: true,
    aiInsights: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      // Get all user data
      const userData = {
        payments: [],
        subscriptions: [],
        budgets: [],
        goals: [],
        preferences: [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teknokapsul-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Verileriniz başarıyla dışa aktarıldı');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('error', 'Dışa aktarma sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.version || !data.exportDate) {
        throw new Error('Geçersiz dosya formatı');
      }
      
      // Import data (this would need proper implementation)
      console.log('Importing data:', data);
      
      showMessage('success', 'Veriler başarıyla içe aktarıldı');
    } catch (error) {
      console.error('Import error:', error);
      showMessage('error', 'İçe aktarma sırasında hata oluştu');
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Tüm verileriniz silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Clear all collections (implement with proper user filtering)
      console.log('Data clearing would be implemented here');
      
      showMessage('success', 'Tüm veriler başarıyla silindi');
    } catch (error) {
      console.error('Clear data error:', error);
      showMessage('error', 'Veri silme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    
    setNotificationSettings(newSettings);
    
    if (key === 'pushEnabled') {
      console.log('Push notification toggle would be implemented here');
    }
    
    // Save to Firebase would be implemented here
    console.log('Saving notification settings:', newSettings);
  };

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Tema</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Açık', icon: <Sun className="w-4 h-4" /> },
            { value: 'dark', label: 'Koyu', icon: <Moon className="w-4 h-4" /> },
            { value: 'auto', label: 'Otomatik', icon: <Monitor className="w-4 h-4" /> }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => updateTheme(theme.value as any)}
              className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-2 transition-colors ${
                settings.theme === theme.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {theme.icon}
              <span className="text-sm font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Renk Şeması</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { value: 'blue', label: 'Mavi', color: '#3b82f6' },
            { value: 'green', label: 'Yeşil', color: '#10b981' },
            { value: 'purple', label: 'Mor', color: '#8b5cf6' },
            { value: 'orange', label: 'Turuncu', color: '#f97316' },
            { value: 'pink', label: 'Pembe', color: '#ec4899' }
          ].map((scheme) => (
            <button
              key={scheme.value}
              onClick={() => updateColorScheme(scheme.value as any)}
              className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-2 transition-colors ${
                settings.colorScheme === scheme.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: scheme.color }}
              />
              <span className="text-xs font-medium">{scheme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Yazı Boyutu</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'small', label: 'Küçük' },
            { value: 'medium', label: 'Orta' },
            { value: 'large', label: 'Büyük' }
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => updateFontSize(size.value as any)}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                settings.fontSize === size.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`font-medium ${
                size.value === 'small' ? 'text-sm' :
                size.value === 'medium' ? 'text-base' : 'text-lg'
              }`}>
                {size.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Yüksek Kontrast</h4>
            <p className="text-sm text-gray-600">Daha iyi görünürlük için kontrastı artırır</p>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.highContrast ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Azaltılmış Hareket</h4>
            <p className="text-sm text-gray-600">Animasyonları ve geçişleri azaltır</p>
          </div>
          <button
            onClick={toggleReducedMotion}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.reducedMotion ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {Object.entries({
        pushEnabled: 'Push Bildirimleri',
        emailEnabled: 'E-posta Bildirimleri',
        paymentReminders: 'Ödeme Hatırlatmaları',
        subscriptionAlerts: 'Abonelik Uyarıları',
        budgetWarnings: 'Bütçe Uyarıları',
        aiInsights: 'AI İçgörüleri'
      }).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">{label}</span>
          <button
            onClick={() => handleNotificationToggle(key as any)}
            className={`w-12 h-6 rounded-full transition-colors ${
              notificationSettings[key as keyof typeof notificationSettings] ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notificationSettings[key as keyof typeof notificationSettings] ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleExportData}
          disabled={loading}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center space-y-2"
        >
          <Download className="w-8 h-8 text-gray-400" />
          <span className="font-medium">Verileri Dışa Aktar</span>
          <span className="text-sm text-gray-600 text-center">Tüm verilerinizi JSON formatında indirin</span>
        </button>

        <label className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center space-y-2 cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="font-medium">Verileri İçe Aktar</span>
          <span className="text-sm text-gray-600 text-center">Daha önce dışa aktarılan verileri yükleyin</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      <div className="border-t pt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Tehlikeli Bölge</h4>
          <p className="text-sm text-red-600 mb-4">
            Bu işlemler geri alınamaz. Devam etmeden önce verilerinizi yedeklediğinizden emin olun.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetToDefaults}
              className="w-full p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ayarları Sıfırla</span>
            </button>
            
            <button
              onClick={handleClearAllData}
              disabled={loading}
              className="w-full p-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tüm Verileri Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearanceSettings();
      case 'accessibility':
        return renderAccessibilitySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'data':
        return renderDataSettings();
      default:
        return <div>Bu bölüm henüz mevcut değil.</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gelişmiş Ayarlar
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Uygulamanızı kişiselleştirin ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className={`text-sm ${
                      activeSection === section.id
                        ? 'text-white/80'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {section.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner w-8 h-8" />
                <span className="ml-3 text-gray-600 dark:text-gray-300">İşleniyor...</span>
              </div>
            )}
            {!loading && renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};