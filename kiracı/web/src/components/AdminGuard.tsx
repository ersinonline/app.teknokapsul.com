import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'clk.ersinnn@gmail.com';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
        <h1 className="text-xl font-semibold text-gray-900">Giriş Gerekli</h1>
        <p className="mt-2 text-sm text-gray-600">Admin paneline erişmek için giriş yapın.</p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-xl mx-auto bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
        <h1 className="text-xl font-semibold text-gray-900">403</h1>
        <p className="mt-2 text-sm text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
        <Link to="/dashboard" className="mt-6 inline-flex text-sm font-medium text-indigo-600 hover:underline">
          Panele dön
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
