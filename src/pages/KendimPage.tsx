import React, { useState, useEffect } from 'react';
import { FileText, Calendar, ChevronRight, StickyNote, ClipboardList, Users, ShoppingBag, Wrench, Crown } from 'lucide-react';
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
      if (!user?.uid) {
        setApplications([]);
        setApplicationsLoading(false);
        return;
      }

      try {
        const applicationData = await applicationService.getUserApplications(user.uid);
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
      id: 'attendance',
      title: 'Yoklama Takibi',
      description: 'Devam durumunuzu takip edin',
      icon: Users,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      route: '/attendance',
      count: 0,
      loading: false,
      items: []
    },
    {
      id: 'premium',
      title: 'Premium Abonelik',
      description: 'Ayrıcalıklı deneyim, komisyonsuz ödemeler',
      icon: Crown,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      route: '/premium',
      count: 0,
      loading: false,
      items: []
    },
    {
      id: 'digital-codes',
      title: 'Dijital Kodlar',
      description: 'Dijital ürün ve kod satın alın',
      icon: ShoppingBag,
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-200',
      route: '/dijital-kodlar',
      count: 0,
      loading: false,
      items: []
    },
    {
      id: 'tekno-hizmet',
      title: 'TeknoHizmet',
      description: '200+ dijital hizmet tek yerde',
      icon: Wrench,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      route: '/tekno-hizmet',
      count: 0,
      loading: false,
      items: []
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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Kapsülüm</h1>
              <p className="text-white/60 text-xs">Kişisel yönetim merkezi</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{eventsLoading ? '...' : upcomingEvents.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Etkinlik</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{notesLoading ? '...' : notes.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Not</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{applicationsLoading ? '...' : activeApplications.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Başvuru</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="page-content -mt-5">
        <div className="bank-card p-1 mb-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.route)}
                className="menu-item w-full"
              >
                <div className={`menu-icon ${section.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${section.textColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!section.loading && section.count > 0 && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {section.count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KendimPage;