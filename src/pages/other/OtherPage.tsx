import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StickyNote, Calendar, HelpCircle, Settings, Car, Home, ChevronRight } from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Note } from '../../types/notes';
import { Event } from '../../types/calendar';
import { Vehicle } from '../../types/vehicle';
import { Home as HomeType } from '../../types/home';
import { FAQ_DATA } from '../faq/faqData';
import { calculateDaysRemaining } from '../../utils/date';

export const OtherPage = () => {
  const navigate = useNavigate();
  const { data: notes = [] } = useFirebaseData<Note>('notes');
  const { data: events = [] } = useFirebaseData<Event>('events');
  const { data: vehicles = [] } = useFirebaseData<Vehicle>('vehicles');
  const { data: homes = [] } = useFirebaseData<HomeType>('homes');

  // Get upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  // Get latest notes
  const latestNotes = notes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  // Get vehicles with upcoming inspections or maintenance
  const vehiclesNeedingAttention = vehicles
    .filter(vehicle => {
      const inspectionDays = calculateDaysRemaining(vehicle.nextInspectionDate);
      const maintenanceDays = calculateDaysRemaining(vehicle.nextMaintenanceDate);
      const insuranceDays = calculateDaysRemaining(vehicle.insuranceEndDate);
      return inspectionDays <= 30 || maintenanceDays <= 30 || insuranceDays <= 30;
    })
    .slice(0, 2);

  // Get homes with upcoming rent payments or contract renewals
  const homesNeedingAttention = homes
    .filter(home => {
      if (home.type === 'rental') {
        const contractDays = calculateDaysRemaining(home.contractEndDate || '');
        return contractDays <= 30;
      }
      return false;
    })
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Diğer İşlemler</h1>

      {/* Vehicles Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-medium">Araçlarım</h2>
            </div>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y">
          {vehiclesNeedingAttention.map(vehicle => (
            <div key={vehicle.id} className="p-4 hover:bg-gray-50">
              <h3 className="font-medium">{vehicle.plate}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Homes Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-medium">Evlerim</h2>
            </div>
            <button
              onClick={() => navigate('/homes')}
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y">
          {homesNeedingAttention.map(home => (
            <div key={home.id} className="p-4 hover:bg-gray-50">
              <h3 className="font-medium">{home.address}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {home.type === 'rental' ? 'Kiralık' : 'Mülk'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StickyNote className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-medium">Notlar</h2>
            </div>
            <button
              onClick={() => navigate('/notes')}
              className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y">
          {latestNotes.map(note => (
            <div key={note.id} className="p-4 hover:bg-gray-50">
              <h3 className="font-medium">{note.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-medium">Takvim</h2>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y">
          {upcomingEvents.map(event => (
            <div key={event.id} className="p-4 hover:bg-gray-50">
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(event.date).toLocaleDateString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-medium">Yardım</h2>
            </div>
            <button
              onClick={() => navigate('/faq')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y">
          {commonFaqs.map((faq, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <h3 className="font-medium">{faq.question}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-medium">Ayarlar</h2>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
            >
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600">
            Profil ayarları, bildirimler ve diğer tercihlerinizi yönetin.
          </p>
        </div>
      </div>
    </div>
  );
};