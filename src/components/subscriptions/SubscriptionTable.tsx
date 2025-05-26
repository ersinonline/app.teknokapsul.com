<<<<<<< HEAD
import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining } from '../../utils/date';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions }) => {
=======
import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Edit2, Trash2, Power } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining, formatDate } from '../../utils/date';
import { deleteSubscription, toggleSubscriptionStatus, updateSubscription } from '../../services/subscription.service';
import { SubscriptionForm } from './SubscriptionForm';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions, onUpdate }) => {
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu aboneliği silmek istediğinizden emin misiniz?')) return;
    
    setIsDeleting(id);
    try {
      await deleteSubscription(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Abonelik silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSubscriptionStatus(id, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error('Error toggling subscription status:', error);
      alert('Abonelik durumu güncellenirken bir hata oluştu.');
    }
  };

>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
  if (subscriptions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p>Henüz herhangi bir abonelik eklenmedi.</p>
      </div>
    );
  }

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  );

<<<<<<< HEAD
  const getStatusInfo = (daysRemaining: number) => {
=======
  const getStatusInfo = (daysRemaining: number, isActive: boolean) => {
    if (!isActive) {
      return {
        icon: <Power className="w-4 h-4" />,
        text: 'Pasif',
        className: 'bg-gray-100 text-gray-800'
      };
    }
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
    if (daysRemaining <= 0) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Bitti',
        className: 'bg-red-100 text-red-800'
      };
    }
    if (daysRemaining <= 7) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: `${daysRemaining} gün kaldı`,
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      icon: <CheckCircle className="w-4 h-4" />,
      text: `${daysRemaining} gün`,
      className: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="overflow-x-auto" aria-label="Abonelik Tablosu">
<<<<<<< HEAD
=======
      {editingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Aboneliği Düzenle</h3>
            <SubscriptionForm
              onSubmit={async (data) => {
                try {
                  await updateSubscription(editingSubscription.id, data);
                  setEditingSubscription(null);
                  onUpdate();
                } catch (error) {
                  console.error('Error updating subscription:', error);
                  alert('Abonelik güncellenirken bir hata oluştu.');
                }
              }}
              initialData={editingSubscription}
            />
            <button
              onClick={() => setEditingSubscription(null)}
              className="mt-4 w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              İptal
            </button>
          </div>
        </div>
      )}

>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Abonelik
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Bitiş Tarihi
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Durum
            </th>
<<<<<<< HEAD
=======
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              İşlemler
            </th>
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedSubscriptions.map((subscription) => {
            const daysRemaining = calculateDaysRemaining(subscription.endDate);
<<<<<<< HEAD
            const { icon, text, className } = getStatusInfo(daysRemaining);
=======
            const { icon, text, className } = getStatusInfo(daysRemaining, subscription.isActive);
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)

            return (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
<<<<<<< HEAD
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                  </div>
=======
                  <div className="text-sm text-gray-500">{subscription.price} TL/ay</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(subscription.endDate)}
                  </div>
                  {subscription.autoRenew && (
                    <div className="text-xs text-gray-400">
                      Otomatik yenileme: {subscription.renewalDay}. gün
                    </div>
                  )}
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}
                  >
                    {icon}
                    {text}
                  </span>
                </td>
<<<<<<< HEAD
=======
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingSubscription(subscription)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(subscription.id, subscription.isActive)}
                      className={`${subscription.isActive ? 'text-green-600 hover:text-green-900' : 'text-gray-600 hover:text-gray-900'}`}
                      title={subscription.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting === subscription.id}
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};