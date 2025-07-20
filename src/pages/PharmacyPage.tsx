import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Search, AlertCircle } from 'lucide-react';

interface Pharmacy {
  name: string;
  address: string;
  phone: string;
  district: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface District {
  name: string;
}

interface ApiPharmacy {
  name: string;
  address: string;
  phone: string;
  dist: string;
  loc: string;
}

const PharmacyPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
    'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
    'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ',
    'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  // İl seçildiğinde ilçeleri getir
  const fetchDistricts = async (city: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(city)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'apikey 7nGwGNaL9BHrAqc6tGJRQu:0Hcm6WXDJcVbPjnpvQSGLy'
        }
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      
      if (data.success && data.result) {
        // API'den gelen ilçeleri benzersiz hale getir
        const uniqueDistricts = Array.from(
          new Set(data.result.map((pharmacy: ApiPharmacy) => pharmacy.dist))
        ).map(districtName => ({ name: districtName as string }));
        
        setDistricts(uniqueDistricts);
      } else {
        throw new Error('Veri alınamadı');
      }
      
    } catch (err) {
      console.error('İlçe yükleme hatası:', err);
      setError('İlçeler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      // Fallback olarak bazı genel ilçeler göster
      setDistricts([
        { name: 'Merkez' },
        { name: 'İlçe bulunamadı' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Nöbetçi eczaneleri getir
  const fetchPharmacies = async () => {
    if (!selectedCity || !selectedDistrict) {
      setError('Lütfen il ve ilçe seçiniz');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(selectedCity)}&ilce=${encodeURIComponent(selectedDistrict)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'apikey 7nGwGNaL9BHrAqc6tGJRQu:0Hcm6WXDJcVbPjnpvQSGLy'
        }
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      
      if (data.success && data.result && data.result.length > 0) {
        const apiPharmacies: Pharmacy[] = data.result.map((pharmacy: ApiPharmacy) => {
          // Koordinatları parse et
          let lat = 39.9208; // Varsayılan Ankara koordinatları
          let lng = 32.8541;
          
          if (pharmacy.loc && pharmacy.loc.includes(',')) {
            const coords = pharmacy.loc.split(',');
            if (coords.length === 2) {
              const parsedLat = parseFloat(coords[0].trim());
              const parsedLng = parseFloat(coords[1].trim());
              if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                lat = parsedLat;
                lng = parsedLng;
              }
            }
          }
          
          return {
            name: pharmacy.name || 'Eczane Adı Belirtilmemiş',
            address: pharmacy.address || 'Adres Belirtilmemiş',
            phone: pharmacy.phone || 'Telefon Belirtilmemiş',
            district: pharmacy.dist || selectedDistrict,
            location: { lat, lng }
          };
        });
        
        setPharmacies(apiPharmacies);
      } else {
        // Veri bulunamadığında fallback göster
        setPharmacies([]);
        setError(`${selectedCity} - ${selectedDistrict} için nöbetçi eczane bulunamadı.`);
      }
      
    } catch (err) {
      console.error('Eczane yükleme hatası:', err);
      setError('Nöbetçi eczaneler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCity) {
      fetchDistricts(selectedCity);
      setSelectedDistrict('');
      setPharmacies([]);
    }
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-center">Nöbetçi Eczaneler</h1>
          <p className="text-center mt-2 text-blue-100">
            Türkiye genelindeki nöbetçi eczaneleri kolayca bulun
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Arama Formu */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Search className="mr-2" size={24} />
            Nöbetçi Eczane Bul
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* İl Seçimi */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                İl
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">İl Seçiniz</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* İlçe Seçimi */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                İlçe
              </label>
              <select
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">İlçe Seçiniz</option>
                {districts.map((district) => (
                  <option key={district.name} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Arama Butonu */}
            <div className="flex items-end">
              <button
                onClick={fetchPharmacies}
                disabled={loading || !selectedCity || !selectedDistrict}
                className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? 'Aranıyor...' : 'Ara'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Sonuçlar */}
        {pharmacies.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">
              {selectedCity} - {selectedDistrict} Nöbetçi Eczaneler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pharmacies.map((pharmacy, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pharmacy.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <MapPin className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                      <span>{pharmacy.address}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="mr-2 flex-shrink-0" size={16} />
                      <a 
                        href={`tel:${pharmacy.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {pharmacy.phone}
                      </a>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="mr-2 flex-shrink-0" size={16} />
                      <span className="text-green-600 font-medium">24 Saat Açık</span>
                    </div>
                  </div>
                  
                  <button className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200">
                    Yol Tarifi Al
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bilgi Bölümü */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Hakkımızda</h2>
          <p className="text-gray-700 leading-relaxed">
            Nöbetçi Eczaneler servisi, Türkiye genelindeki nöbetçi eczaneleri kolayca bulmanızı sağlar. 
            Acil durumlarda ihtiyacınız olan ilaçlara en kısa sürede ulaşmanıza yardımcı olmak için 
            güncel ve güvenilir bilgilerle 7/24 hizmetinizdeyiz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PharmacyPage;