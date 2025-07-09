import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Edit2, Trash2, Power } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { calculateDaysRemaining, formatDate } from '../../utils/date';
import { deleteSubscription, toggleSubscriptionStatus, updateSubscription } from '../../services/subscription.service';
import { SubscriptionForm } from './SubscriptionForm';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions, onUpdate }) => {
  const { user } = useAuth();
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Bu aboneliği silmek istediğinizden emin misiniz?')) return;
    
    setIsDeleting(id);
    try {
      await deleteSubscription(id, user.uid);
      onUpdate();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Abonelik silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    
    setIsToggling(id);
    try {
      await toggleSubscriptionStatus(id, user.uid, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error('Error toggling subscription status:', error);
      alert('Abonelik durumu güncellenirken bir hata oluştu.');
    } finally {
      setIsToggling(null);
    }
  };

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

  const getStatusInfo = (daysRemaining: number, isActive: boolean) => {
    if (!isActive) {
      return {
        icon: <Power className="w-4 h-4" />,
        text: 'Pasif',
        className: 'bg-gray-100 text-gray-800'
      };
    }
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
    <div aria-label="Abonelik Tablosu">
      {editingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-base lg:text-lg font-medium mb-4 text-gray-900">Aboneliği Düzenle</h3>
            <SubscriptionForm
              onSubmit={async (data) => {
                if (!user) return;
                try {
                  await updateSubscription(editingSubscription.id, user.uid, data);
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

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Bitiş Tarihi
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Durum
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSubscriptions.map((subscription) => {
              const daysRemaining = calculateDaysRemaining(subscription.endDate);
              const { icon, text, className } = getStatusInfo(daysRemaining, subscription.isActive);

              return (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}
                    >
                      {icon}
                      {text}
                    </span>
                  </td>
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
                        className={`${subscription.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} disabled:opacity-50`}
                        title={subscription.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        disabled={isToggling === subscription.id}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 p-3">
        {sortedSubscriptions.map((subscription) => {
          const daysRemaining = calculateDaysRemaining(subscription.endDate);
          const { icon, text, className } = getStatusInfo(daysRemaining, subscription.isActive);

          return (
            <div key={subscription.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{subscription.name}</h3>
          <p className="text-xs text-gray-500">{subscription.price} TL/ay</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}
                >
                  {icon}
                  {text}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-gray-500">
                  Bitiş: {formatDate(subscription.endDate)}
                </p>
                {subscription.autoRenew && (
                  <p className="text-xs text-gray-400">
                    Otomatik yenileme: {subscription.renewalDay}. gün
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingSubscription(subscription)}
                  className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded"
                  title="Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(subscription.id, subscription.isActive)}
                  className={`p-2 ${subscription.isActive ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-red-600 hover:text-red-900 hover:bg-red-50'} disabled:opacity-50 rounded`}
                  title={subscription.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                  disabled={isToggling === subscription.id}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(subscription.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                  disabled={isDeleting === subscription.id}
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};