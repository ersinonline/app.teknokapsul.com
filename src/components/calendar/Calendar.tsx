import React from 'react';
import { Event } from '../../types/calendar';

interface CalendarProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  events,
  selectedDate,
  onDateSelect,
}) => {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = getFirstDayOfMonth(selectedDate);
  const today = new Date();

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Render weekday headers
    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="font-medium text-gray-500 text-center py-3">
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-4" />);
    }

    // Render the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isSelected = 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => onDateSelect(date)}
          className={`p-4 min-h-[60px] cursor-pointer hover:bg-gray-50 relative flex flex-col items-center justify-start ${
            isSelected ? 'bg-yellow-50' : ''
          }`}
        >
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              isToday
                ? 'text-white'
                : isSelected
                ? 'text-[#ffb700]'
                : ''
            }`}
            style={{
              backgroundColor: isToday ? '#ffb700' : isSelected ? '#ffb700' + '20' : 'transparent'
            }}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-1">
                {dayEvents.slice(0, 3).map((_, index) => (
                  <div
                    key={index}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#ffb700' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {renderCalendarDays()}
    </div>
  );
};