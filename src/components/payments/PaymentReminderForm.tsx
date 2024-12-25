import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { createPaymentReminder } from '../../services/reminder.service';

interface PaymentReminderFormProps {
  paymentId: string;
  userId: string;
  onClose: () => void;
}

export const PaymentReminderForm: React.FC<PaymentReminderFormProps> = ({
  paymentId,
  userId,
  onClose
}) => {
  const [reminderDate, setReminderDate] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'push' | 'sms'>('email');
  const [reminderType, setReminderType] = useState<'once' | 'daily' | 'weekly'>('once');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPaymentReminder({
        userId,
        paymentId,
        reminderDate,
        notificationMethod,
        reminderType
      });
      onClose();
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg font-medium">Ödeme Hatırlatıcısı Ekle</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hatırlatma Tarihi
          </label>
          <input
            type="datetime-local"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bildirim Yöntemi
          </label>
          <select
            value={notificationMethod}
            onChange={(e) => setNotificationMethod(e.target.value as 'email' | 'push' | 'sms')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="email">E-posta</option>
            <option value="push">Push Bildirim</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tekrar Sıklığı
          </label>
          <select
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value as 'once' | 'daily' | 'weekly')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="once">Bir Kez</option>
            <option value="daily">Her Gün</option>
            <option value="weekly">Her Hafta</option>
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Hatırlatıcı Ekle
          </button>
        </div>
      </form>
    </div>
  );
};