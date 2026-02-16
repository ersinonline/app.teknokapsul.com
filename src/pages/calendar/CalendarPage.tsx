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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Takvim</h1>
                <p className="text-white/60 text-xs">
                  {selectedDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEventFormOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-sm min-w-[160px] text-center">
              {selectedDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bank-card p-4">
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>

          {/* Event List Section */}
          <div className="bank-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Etkinlikler</h2>
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
            onSave={async () => { await reload(); setIsEventFormOpen(false); }}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
};