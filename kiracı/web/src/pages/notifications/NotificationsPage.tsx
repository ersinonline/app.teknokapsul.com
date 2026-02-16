import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const getIcon = (type: string) => {
  switch (type) {
    case 'payment_due': return '💳';
    case 'payment_success': return '✅';
    case 'request_new': return '📋';
    case 'contract_new': return '📄';
    case 'payout_ready': return '💰';
    default: return '🔔';
  }
};

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bildirimler</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? <><strong className="text-teal-600">{unreadCount}</strong> okunmamış bildirim</>
              : 'Tüm bildirimler okundu.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary text-xs">
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="text-5xl mb-4">🔔</div>
            <p className="empty-state-title">Henüz bildirim yok</p>
            <p className="empty-state-text">Ödeme, sözleşme ve talep bildirimleri burada görünecek.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`card w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors ${!notif.read ? 'border-l-4 border-l-teal-500 bg-teal-50/20' : ''}`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{getIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-teal-500 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {notif.createdAt?.toDate
                    ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: tr })
                    : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
