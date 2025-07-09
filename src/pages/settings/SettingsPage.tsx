import React, { useState } from 'react';
import { Settings, User, Lock, Bell, MessageSquare, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, updateUserPassword } from '../../services/auth.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import { FeedbackForm } from '../../components/feedback/FeedbackForm';
import { NotificationPreferences } from '../../components/notifications/NotificationPreferences';
import { ProfileManagement } from '../../components/profile/ProfileManagement';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateUserProfile(formData.displayName);
      setSuccess('Profil başarıyla güncellendi.');
    } catch (err) {
      setError('Profil güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateUserPassword(formData.currentPassword, formData.newPassword);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Ayarlar</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            </div>
          )}

          {/* Profil Ayarları */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5" style={{ color: '#ffb700' }} />
              <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
            </div>
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{ backgroundColor: '#ffb700' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
              </button>
            </form>
          </div>

          {/* Şifre Değiştirme */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5" style={{ color: '#ffb700' }} />
              <h2 className="text-lg font-semibold text-gray-900">Şifre Değiştirme</h2>
            </div>
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{ backgroundColor: '#ffb700' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>

          {/* Bildirim Tercihleri */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5" style={{ color: '#ffb700' }} />
              <h2 className="text-lg font-semibold text-gray-900">Bildirim Tercihleri</h2>
            </div>
            <NotificationPreferences />
          </div>

          {/* Profil Yönetimi */}
          <ProfileManagement 
            onSuccess={(message) => setSuccess(message)}
            onError={(message) => setError(message)}
          />

          {/* Geri Bildirim Formu */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Geri Bildirim</h2>
            </div>
            <FeedbackForm />
          </div>
        </div>
      </div>
    </div>
  );
};