import React, { useState, useEffect } from 'react';
import { FileText, Calendar, ChevronRight, StickyNote, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '../services/application.service';
import { Application } from '../types/application';
import { Note } from '../types/notes';
import { Event } from '../types/calendar';

const KendimPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Firebase'den gerçek verileri çek
  const { data: notes, loading: notesLoading } = useFirebaseData<Note>('notes');
  const { data: events, loading: eventsLoading } = useFirebaseData<Event>('events');
  
  // Başvurular için ayrı state ve fetch fonksiyonu
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) {
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }

      try {
        const applicationData = await applicationService.getUserApplications(user.id);
        setApplications(applicationData);
      } catch (error) {
        console.error('Error fetching applications data:', error);
        setApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Yaklaşan etkinlikleri filtrele (gelecek 7 gün)
  const upcomingEvents = events.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    return eventDate >= now && eventDate <= sevenDaysFromNow;
  });

  // Aktif başvuruları filtrele (beklemede veya onaylanmış olanlar)
  const activeApplications = applications.filter(app => 
    app.status === 'pending' || app.status === 'approved'
  );

  const sections = [
    {
      id: 'calendar',
      title: 'Takvimim',
      description: 'Etkinliklerinizi yönetin',
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      route: '/calendar',
      count: upcomingEvents.length,
      loading: eventsLoading,
      items: upcomingEvents.slice(0, 3).map(event => ({
        id: event.id,
        name: event.title,
        date: new Date(event.date).toLocaleDateString('tr-TR'),
        type: 'Etkinlik'
      }))
    },
    {
      id: 'documents',
      title: 'Belgelerim',
      description: 'Önemli belgelerinizi saklayın',
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      route: '/documents',
      count: notes.length,
      loading: notesLoading,
      items: notes.slice(0, 3).map(note => ({
        id: note.id,
        name: note.title,
        date: new Date(note.createdAt).toLocaleDateString('tr-TR'),
        type: 'Not'
      }))
    },
    {
      id: 'notes',
      title: 'Notlarım',
      description: 'Kişisel notlarınızı yönetin',
      icon: StickyNote,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      route: '/notes',
      count: notes.length,
      loading: notesLoading,
      items: notes.slice(0, 3).map(note => ({
        id: note.id,
        name: note.title,
        date: new Date(note.createdAt).toLocaleDateString('tr-TR'),
        type: 'Not'
      }))
    },
    {
      id: 'applications',
      title: 'Başvurularım',
      description: 'Başvurularınızı takip edin',
      icon: ClipboardList,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      route: '/applications',
      count: activeApplications.length,
      loading: applicationsLoading,
      items: activeApplications.slice(0, 3).map(app => ({
        id: app.id,
        name: app.serviceName,
        date: new Date(app.createdAt).toLocaleDateString('tr-TR'),
        type: app.status === 'pending' ? 'Beklemede' : 'Onaylandı'
      }))
    }
  ];

  const handleSectionClick = (route: string) => {
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" style={{ color: '#ffb700' }} />
              <h1 className="text-2xl font-bold text-gray-900">Kapsülüm</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.route)}
                className={`${section.bgColor} ${section.borderColor} border rounded-xl p-6 cursor-pointer hover:shadow-md transition-all duration-300 group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${section.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${section.textColor} text-lg`}>
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {section.description}
                      </p>
                      {section.id !== 'calendar' && section.id !== 'applications' && (section.loading ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <span className="text-xs text-gray-500">Yükleniyor...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-sm font-medium ${section.textColor}`}>
                            {section.count} {section.id === 'documents' ? 'belge' : section.id === 'notes' ? 'not' : 'öğe'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${section.textColor} group-hover:translate-x-1 transition-transform duration-300`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KendimPage;