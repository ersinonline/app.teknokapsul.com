import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addEvent } from '../../services/calendar.service';
import { scheduleEventNotification } from '../../services/notification.service';

interface EventFormProps {
  onClose: () => void;
  onSave: () => void;
  selectedDate: Date;
}

export const EventForm: React.FC<EventFormProps> = ({ onClose, onSave, selectedDate }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
    time: '12:00',
    type: 'event' as 'event' | 'birthday' | 'reminder'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const event = {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        date: `${formData.date}T${formData.time}`,
        type: formData.type,
        createdAt: new Date().toISOString()
      };

      const eventId = await addEvent(event, user.id);
      await scheduleEventNotification({ ...event, id: eventId });
      
      onSave();
      onClose();
    } catch (err) {
      setError('Etkinlik kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Etkinlik</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Başlık
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Tarih
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Saat
              </label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Etkinlik Türü
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'event' | 'birthday' | 'reminder' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              required
            >
              <option value="event">Etkinlik</option>
              <option value="birthday">Doğum Günü</option>
              <option value="reminder">Hatırlatıcı</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};