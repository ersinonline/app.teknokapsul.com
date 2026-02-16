import { useNavigate } from 'react-router-dom';
import { StickyNote, Calendar, HelpCircle, Settings, Package, ChevronRight } from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Note } from '../../types/notes';
import { Event } from '../../types/calendar';
import { FAQ_DATA } from '../faq/faqData';

export const OtherPage = () => {
  const navigate = useNavigate();
  const { data: notes = [] } = useFirebaseData<Note>('notes');
  const { data: events = [] } = useFirebaseData<Event>('events');

  // Get upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  // Get latest notes
  const latestNotes = notes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  // Get most common FAQs
  const commonFaqs = FAQ_DATA[0].questions.slice(0, 3);

  const sections = [
    { icon: Package, label: 'Siparişlerim', desc: 'Siparişlerinizi takip edin', path: '/other/my-orders', color: 'bg-orange-50', iconColor: 'text-orange-500' },
    { icon: StickyNote, label: 'Notlar', desc: `${notes.length} not`, path: '/notes', color: 'bg-amber-50', iconColor: 'text-amber-500' },
    { icon: Calendar, label: 'Takvim', desc: `${upcomingEvents.length} yaklaşan etkinlik`, path: '/calendar', color: 'bg-green-50', iconColor: 'text-green-500' },
    { icon: HelpCircle, label: 'Yardım', desc: 'SSS ve destek', path: '/faq', color: 'bg-blue-50', iconColor: 'text-blue-500' },
    { icon: Settings, label: 'Ayarlar', desc: 'Profil ve tercihler', path: '/settings', color: 'bg-slate-50', iconColor: 'text-slate-500' },
  ];

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Diğer İşlemler</h1>
              <p className="text-white/60 text-xs">Hızlı erişim menüsü</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className="bank-card p-4 w-full flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${section.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${section.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                <p className="text-[11px] text-muted-foreground">{section.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}

        {/* Recent Notes */}
        {latestNotes.length > 0 && (
          <div className="bank-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Son Notlar</h2>
              <button onClick={() => navigate('/notes')} className="text-[11px] text-primary font-medium">Tümü</button>
            </div>
            {latestNotes.map(note => (
              <div key={note.id} className="px-4 py-3 border-b border-border/20 last:border-b-0">
                <h3 className="text-xs font-medium text-foreground">{note.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="bank-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Yaklaşan Etkinlikler</h2>
              <button onClick={() => navigate('/calendar')} className="text-[11px] text-primary font-medium">Tümü</button>
            </div>
            {upcomingEvents.map(event => (
              <div key={event.id} className="px-4 py-3 border-b border-border/20 last:border-b-0">
                <h3 className="text-xs font-medium text-foreground">{event.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(event.date).toLocaleDateString('tr-TR')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};