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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nöbetçi Eczaneler</h1>
              <p className="text-white/60 text-xs">Türkiye geneli arama</p>
            </div>
          </div>
          {/* Search Form */}
          <div className="space-y-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:bg-white/15 [&>option]:text-gray-900"
            >
              <option value="">İl Seçiniz</option>
              {cities.map((city) => (<option key={city} value={city}>{city}</option>))}
            </select>
            <div className="flex gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity}
                className="flex-1 px-3 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:bg-white/15 disabled:opacity-40 [&>option]:text-gray-900"
              >
                <option value="">İlçe Seçiniz</option>
                {districts.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
              </select>
              <button
                onClick={fetchPharmacies}
                disabled={loading || !selectedCity || !selectedDistrict}
                className="px-5 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 disabled:opacity-40 transition-colors"
              >
                {loading ? '...' : 'Ara'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-3 mb-6">
        {error && (
          <div className="bank-card p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-600">{error}</span>
          </div>
        )}

        {pharmacies.length > 0 && (
          <>
            <div className="bank-card px-4 py-3">
              <h2 className="text-xs font-semibold text-foreground">{selectedCity} - {selectedDistrict} ({pharmacies.length} eczane)</h2>
            </div>
            {pharmacies.map((pharmacy, index) => (
              <div key={index} className="bank-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">{pharmacy.name}</h3>
                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{pharmacy.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <a href={`tel:${pharmacy.phone}`} className="text-primary">{pharmacy.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-emerald-600 font-medium">24 Saat Açık</span>
                  </div>
                </div>
                <button className="mt-3 w-full bg-emerald-500 text-white py-2 rounded-xl text-xs font-medium hover:bg-emerald-600 transition-colors">
                  Yol Tarifi Al
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyPage;