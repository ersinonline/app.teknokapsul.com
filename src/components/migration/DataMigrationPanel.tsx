import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { userMigrationService, UserMigrationMapping, MigrationResult } from '../../services/user-migration.service';
import { Loader2, CheckCircle, XCircle, AlertCircle, Database, ArrowRight } from 'lucide-react';

interface DataMigrationPanelProps {
  onMigrationComplete?: (result: MigrationResult) => void;
}

export const DataMigrationPanel: React.FC<DataMigrationPanelProps> = ({ onMigrationComplete }) => {
  const { user, isLoaded } = useUser();
  const [migrationStatus, setMigrationStatus] = useState<UserMigrationMapping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [manualUid, setManualUid] = useState('');
  const [isManualMigration, setIsManualMigration] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      checkMigrationStatus();
    }
  }, [isLoaded, user]);

  const checkMigrationStatus = async () => {
    if (!user) return;
    
    try {
      const status = await userMigrationService.getMigrationStatus(user.id);
      setMigrationStatus(status);
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleMigration = async () => {
    if (!user || !user.primaryEmailAddress) return;
    
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await userMigrationService.autoMigrateUser(
        user.id,
        user.primaryEmailAddress.emailAddress,
        user.fullName || undefined
      );
      
      setMigrationResult(result);
      await checkMigrationStatus();
      onMigrationComplete?.(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration sırasında hata oluştu: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMigration = async () => {
    if (!user || !user.primaryEmailAddress || !manualUid.trim()) return;
    
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await userMigrationService.migrateUserByUid(
        user.id,
        manualUid.trim(),
        user.primaryEmailAddress.emailAddress,
        user.fullName || undefined
      );
      
      setMigrationResult(result);
      await checkMigrationStatus();
      onMigrationComplete?.(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Manuel migration sırasında hata oluştu: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Tamamlandı</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Beklemede</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Başarısız</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Bilinmiyor</span>;
    }
  };

  if (!isLoaded) {
    return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Yükleniyor...</span>
      </div>
    </div>
  );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
          <span className="text-yellow-800">
            Veri migration işlemi için giriş yapmanız gerekiyor.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Database className="w-5 h-5" />
            Veri Migration İşlemi
          </h2>
          <p className="text-gray-600 mt-1">
            Firebase'deki mevcut verilerinizi Clerk hesabınıza aktarın
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Kullanıcı Bilgileri */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Hesap Bilgileri</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
              <p><strong>İsim:</strong> {user.fullName || 'Belirtilmemiş'}</p>
              <p><strong>Clerk ID:</strong> {user.id}</p>
            </div>
          </div>

          {/* Migration Durumu */}
          {migrationStatus && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Migration Durumu</h4>
                {getStatusBadge(migrationStatus.status)}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Firebase UID:</strong> {migrationStatus.firebaseUid}</p>
                <p><strong>Migration Tarihi:</strong> {new Date(migrationStatus.migrationDate).toLocaleString('tr-TR')}</p>
                {migrationStatus.status === 'completed' && (
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Migration Detayları */}
          {showDetails && migrationStatus && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Migration Detayları</h4>
              <div className="space-y-2 text-sm">
                {migrationResult?.migratedCollections && (
                  <div>
                    <p className="font-medium text-green-800">Aktarılan Koleksiyonlar:</p>
                    <ul className="list-disc list-inside text-green-700 ml-2">
                      {migrationResult.migratedCollections.map((collection, index) => (
                        <li key={index}>{collection}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {migrationResult?.errors && migrationResult.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-800">Hatalar:</p>
                    <ul className="list-disc list-inside text-red-700 ml-2">
                      {migrationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Migration Sonucu */}
          {migrationResult && (
            <div className={`rounded-lg p-4 ${migrationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center">
                {migrationResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <span className={migrationResult.success ? 'text-green-800' : 'text-red-800'}>
                  {migrationResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Migration Seçenekleri */}
          <div className="pt-4 border-t space-y-4">
            {/* Otomatik Migration */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Otomatik Migration</h4>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {migrationStatus?.status === 'completed' ? (
                    'Verileriniz başarıyla aktarıldı'
                  ) : (
                    'Email adresiniz ile Firebase verilerinizi otomatik olarak bulup aktarır'
                  )}
                </div>
                <button 
                  onClick={handleMigration}
                  disabled={isLoading || migrationStatus?.status === 'completed' || isManualMigration}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    isLoading || migrationStatus?.status === 'completed' || isManualMigration
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading && !isManualMigration ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Migration Yapılıyor...
                    </>
                  ) : migrationStatus?.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Tamamlandı
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Otomatik Aktar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Manuel Migration */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Manuel Migration (UID ile)</h4>
              <p className="text-sm text-gray-600">
                Firebase UID'nizi biliyorsanız, direkt olarak verilerinizi aktarabilirsiniz
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualUid}
                  onChange={(e) => setManualUid(e.target.value)}
                  placeholder="Firebase UID'nizi girin (örn: abc123def456...)"
                  disabled={isLoading || migrationStatus?.status === 'completed'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={handleManualMigration}
                  disabled={isLoading || migrationStatus?.status === 'completed' || !manualUid.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    isLoading || migrationStatus?.status === 'completed' || !manualUid.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  onMouseEnter={() => setIsManualMigration(true)}
                  onMouseLeave={() => setIsManualMigration(false)}
                >
                  {isLoading && isManualMigration ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Migration Yapılıyor...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      UID ile Aktar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-blue-800">
            <strong>Önemli:</strong> Bu işlem Firebase'deki mevcut verilerinizi Clerk hesabınıza aktaracaktır. 
            İşlem tamamlandıktan sonra verileriniz yeni kimlik sistemi ile çalışacaktır. 
            Migration işlemi geri alınamaz, bu nedenle önemli verilerinizin yedeğini almanızı öneririz.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMigrationPanel;