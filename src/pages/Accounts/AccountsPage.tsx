import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlatformCredentialsByEmail, PlatformCredential } from '../../services/platformCredentials.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { AccountsList } from '../../components/accounts/AccountsList';

export const AccountsPage = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const data = await getPlatformCredentialsByEmail(user.email);
        setCredentials(data);
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [user]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Kopyalandı!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setCopySuccess('Kopyalama başarısız!');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={Key}
        title="Hesap Bulunamadı"
        description="Henüz kayıtlı bir hesabınız bulunmamaktadır."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Hesaplarım</h1>
        {copySuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
            {copySuccess}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Key className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Tüm hesap bilgileriniz güvenli bir şekilde saklanmaktadır. Şifreleri görüntülemek veya kopyalamak için ilgili butona tıklayabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <AccountsList credentials={credentials} onCopy={handleCopy} />
    </div>
  );
};