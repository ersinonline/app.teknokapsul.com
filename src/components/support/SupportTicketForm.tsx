import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, User, Mail, Phone, MessageSquare, Tag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createSupportTicket } from '../../services/support.service';
import { SupportTicketFormData, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from '../../types/support';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SupportTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SupportTicketForm: React.FC<SupportTicketFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<SupportTicketFormData>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    email: user?.email || '',
    name: user?.displayName || '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Destek talebi oluşturmak için giriş yapmalısınız.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Başlık ve açıklama alanları zorunludur.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createSupportTicket(formData);
      setSuccess(true);
      
      // 2 saniye sonra success callback'i çağır
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('Destek talebi oluşturulurken hata:', err);
      setError('Destek talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SupportTicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Destek Talebiniz Oluşturuldu!
        </h3>
        <p className="text-gray-600 mb-6">
          Talebiniz başarıyla kaydedildi. En kısa sürede size dönüş yapacağız.
        </p>
        <div className="w-20 h-1 bg-[#ffb700] rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Destek Talebi Oluştur
        </h3>
        <p className="text-gray-600">
          Sorununuzu detaylı bir şekilde açıklayın, size en kısa sürede yardımcı olalım.
        </p>
        <div className="w-20 h-1 bg-[#ffb700] rounded-full mt-3"></div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kişisel Bilgiler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Ad Soyad *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#ffb700] focus:border-transparent"
              placeholder="Adınız ve soyadınız"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              E-posta *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              placeholder="email@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Telefon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
            placeholder="0555 123 45 67"
          />
        </div>

        {/* Talep Detayları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              required
            >
              {Object.entries(SUPPORT_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Öncelik *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              required
            >
              {Object.entries(SUPPORT_PRIORITIES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Konu Başlığı *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
            placeholder="Sorununuzu kısaca özetleyin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Açıklama *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent resize-none"
            placeholder="Sorununuzu detaylı bir şekilde açıklayın. Ne yapmaya çalıştığınız, hangi hatayı aldığınız, ne zaman başladığı gibi bilgileri ekleyin."
            required
          />
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              İptal
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a600] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Destek Talebi Gönder
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};