import { Link, useLocation } from 'react-router-dom';

const AdminNav: React.FC = () => {
  const { pathname } = useLocation();

  const items = [
    { to: '/admin', label: 'Özet', exact: true },
    { to: '/admin/contracts', label: 'Sözleşmeler', exact: false },
    { to: '/admin/payments', label: 'Ödemeler', exact: false },
    { to: '/admin/payouts', label: 'Aktarımlar', exact: false },
    { to: '/admin/holidays', label: 'Tatiller', exact: false },
    { to: '/admin/audit', label: 'Denetim', exact: false },
    { to: '/admin/agents', label: 'Emlakçılar', exact: false },
    { to: '/admin/permissions', label: 'Yetkiler', exact: false },
    { to: '/admin/withdrawals', label: 'Çekimler', exact: false },
  ];

  return (
    <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm min-w-max">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNav;
