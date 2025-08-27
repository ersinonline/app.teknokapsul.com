import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { PlatformCredential } from '../../services/platformCredentials.service';

interface AccountCardProps {
  credential: PlatformCredential;
  onCopy: (text: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ credential, onCopy }) => {
  // Debug: Konsola credential bilgilerini yazdır
  console.log('Credential data:', credential);
  
  // Platform adını düzelt - eğer sayı ise banka isimlerine çevir
  const getPlatformDisplayName = (platformName: string) => {
    const bankNames: { [key: string]: string } = {
      '0': 'Ziraat Bankası',
      '1': 'İş Bankası',
      '2': 'Garanti BBVA',
      '3': 'Akbank',
      '4': 'Yapı Kredi',
      '5': 'Halkbank',
      '6': 'VakıfBank',
      '7': 'Denizbank',
      '8': 'QNB Finansbank',
      '9': 'TEB'
    };
    
    // Eğer platformName sayısal bir ID ise, banka adına çevir
    if (bankNames[platformName]) {
      return bankNames[platformName];
    }
    
    // Eğer platformName zaten bir banka adı ise, doğru formatta göster
    const normalizedName = platformName.toLowerCase();
    
    // Yaygın banka adı varyasyonlarını standart forma çevir
    const bankNameMappings: { [key: string]: string } = {
      'ziraat': 'Ziraat Bankası',
      'ziraat bankası': 'Ziraat Bankası',
      'ziraatbankası': 'Ziraat Bankası',
      'is bankası': 'İş Bankası',
      'iş bankası': 'İş Bankası',
      'isbankası': 'İş Bankası',
      'işbankası': 'İş Bankası',
      'garanti': 'Garanti BBVA',
      'garanti bbva': 'Garanti BBVA',
      'garantibbva': 'Garanti BBVA',
      'akbank': 'Akbank',
      'yapı kredi': 'Yapı Kredi',
      'yapıkredi': 'Yapı Kredi',
      'yapikredi': 'Yapı Kredi',
      'halkbank': 'Halkbank',
      'vakıfbank': 'VakıfBank',
      'vakifbank': 'VakıfBank',
      'denizbank': 'Denizbank',
      'qnb finansbank': 'QNB Finansbank',
      'qnbfinansbank': 'QNB Finansbank',
      'finansbank': 'QNB Finansbank',
      'teb': 'TEB'
    };
    
    // Normalize edilmiş isimde eşleşme ara
    for (const [key, value] of Object.entries(bankNameMappings)) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
    
    // Eğer hiçbir eşleşme bulunamazsa, orijinal değeri döndür (ilk harfi büyük yap)
    return platformName.charAt(0).toUpperCase() + platformName.slice(1);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {getPlatformDisplayName(credential.platformName)}
          </h3>
          <a
            href={`https://${credential.platformName.toLowerCase()}.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            Siteye Git
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">E-posta</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={credential.platformEmail}
                className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-gray-800 text-sm"
              />
              <button
                onClick={() => onCopy(credential.platformEmail)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="E-postayı kopyala"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Şifre</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={credential.password}
                className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-gray-800 text-sm"
              />
              <button
                onClick={() => onCopy(credential.password)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Şifreyi kopyala"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};