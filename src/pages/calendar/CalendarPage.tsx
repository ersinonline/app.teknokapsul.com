import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Event } from '../../types/calendar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Calendar } from '../../components/calendar/Calendar';
import { EventForm } from '../../components/calendar/EventForm';
import { EventList } from '../../components/calendar/EventList';

export const CalendarPage = () => {
  const { user } = useAuth();
  const { data: events = [], loading, error, reload } = useFirebaseData<Event>('events');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  const changeMonth = (offset) => {
    setSelectedDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + offset, 1));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Etkinlikler yüklenirken bir hata oluştu." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Takvim</h1>
        <button
          onClick={() => setIsEventFormOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Etkinlik
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">
                {selectedDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
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
        <div>
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
  );
};