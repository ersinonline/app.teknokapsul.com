import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Event } from '../../types/calendar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Calendar } from '../../components/calendar/Calendar';
import { EventForm } from '../../components/calendar/EventForm';
import { EventList } from '../../components/calendar/EventList';

export const CalendarPage = () => {
  const { data: events = [], loading, error, reload } = useFirebaseData<Event>('events');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  const changeMonth = (offset: number) => {
    setSelectedDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + offset, 1));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Etkinlikler yüklenirken bir hata oluştu." />;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-xl font-semibold text-gray-900">Takvim</h1>
          </div>
            <button
              onClick={() => setIsEventFormOpen(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" style={{ color: '#ffb700' }} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>

          {/* Event List Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" style={{ color: '#ffb700' }} />
                <h2 className="text-lg font-semibold text-gray-900">Etkinlikler</h2>
              </div>
            </div>
            <EventList
              events={events}
              selectedDate={selectedDate}
              onEventDelete={reload}
            />
          </div>
        </div>

        {/* Event Form Modal */}
        {isEventFormOpen && (
          <EventForm
            onClose={() => setIsEventFormOpen(false)}
            onSave={async () => {
              await reload();
              setIsEventFormOpen(false);
            }}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
};