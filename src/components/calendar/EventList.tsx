import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { Event } from '../../types/calendar';
import { deleteEvent } from '../../services/calendar.service';
import { useAuth } from '../../contexts/AuthContext';

interface EventListProps {
  events: Event[];
  selectedDate: Date;
  onEventDelete: () => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  selectedDate,
  onEventDelete,
}) => {
  const { user } = useAuth();
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const handleDelete = async (eventId: string) => {
    if (!user) return;
    try {
      await deleteEvent(eventId, user.id);
      onEventDelete();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'bg-pink-100 text-pink-800';
      case 'reminder':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'Doğum Günü';
      case 'reminder':
        return 'Hatırlatıcı';
      default:
        return 'Etkinlik';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">
        {selectedDate.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </h2>

      {filteredEvents.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Bu tarihte etkinlik bulunmuyor.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getEventTypeColor(event.type)}`}>
                  {getEventTypeLabel(event.type)}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(event.date).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};