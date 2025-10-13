import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Zap, Shield, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { Subscription } from '../types/subscription';
import { CargoTracking } from '../types/cargo';
import { getUserCargoTrackings } from '../services/cargo.service';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface Warranty {
  id: string;
  productName: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string;
  warrantyPeriod: number;
  category: string;
  createdAt: Date;
  userId: string;
}

const EvimPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Firebase'den gerçek verileri çek
  const { data: subscriptions, loading: subscriptionsLoading } = useFirebaseData<Subscription>('subscriptions');
  
  // Kargo ve garanti verileri için state
  const [cargoList, setCargoList] = useState<CargoTracking[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [cargoLoading, setCargoLoading] = useState(true);
  const [warrantyLoading, setWarrantyLoading] = useState(true);

  // Kargo verilerini yükle
  const loadCargoData = async () => {
    if (!user) return;
    
    try {
      const cargos = await getUserCargoTrackings(user.id);
      setCargoList(cargos);
    } catch (error) {
      console.error('Error loading cargo data:', error);
    } finally {
      setCargoLoading(false);
    }
  };

  // Garanti verilerini yükle
  const loadWarrantyData = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'teknokapsul', user.id, 'warranties'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const warrantiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Warranty[];
      setWarranties(warrantiesData);
    } catch (error) {
      console.error('Error loading warranty data:', error);
    } finally {
      setWarrantyLoading(false);
    }
  };

  // Garanti durumunu hesapla
  const getWarrantyStatus = (warranty: Warranty) => {
    const purchase = new Date(warranty.purchaseDate);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + warranty.warrantyPeriod);
    const today = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return 'expired';
    } else if (daysLeft <= 30) {
      return 'expiring_soon';
    } else {
      return 'active';
    }
  };

  useEffect(() => {
    if (user) {
      loadCargoData();
      loadWarrantyData();
    }
  }, [user]);

  // Aktif abonelikleri filtrele
  const activeSubscriptions = subscriptions.filter(sub => {
    const endDate = new Date(sub.endDate);
    return sub.isActive && endDate > new Date();
  });

  // Kargo istatistikleri
  const pendingCargos = cargoList.filter(cargo => !cargo.isDelivered);

  // Garanti istatistikleri
  const activeWarranties = warranties.filter(w => getWarrantyStatus(w) === 'active');

  const sections = [
    {
      id: 'subscriptions',
      title: 'Aboneliklerim',
      description: 'Aktif aboneliklerinizi yönetin',
      icon: Zap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      route: '/subscriptions',
      count: activeSubscriptions.length,
      loading: subscriptionsLoading,
      items: activeSubscriptions.slice(0, 3).map(sub => ({
        id: sub.id,
        name: sub.name,
        endDate: new Date(sub.endDate).toLocaleDateString('tr-TR'),
        status: 'active'
      }))
    },
    {
      id: 'warranty',
      title: 'Garanti Takibi',
      description: 'Ürün garantilerinizi takip edin',
      icon: Shield,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      route: '/warranty-tracking',
      count: activeWarranties.length,
      loading: warrantyLoading,
      items: []
    },
    {
      id: 'cargo',
      title: 'Kargo Takibi',
      description: 'Kargolarınızı takip edin',
      icon: Truck,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      route: '/cargo-tracking',
      count: pendingCargos.length,
      loading: cargoLoading,
      items: []
    }
  ];

  const handleSectionClick = (route: string) => {
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6" style={{ color: '#ffb700' }} />
              <h1 className="text-2xl font-bold text-gray-900">Evim</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.route)}
                className={`${section.bgColor} ${section.borderColor} border rounded-xl p-6 cursor-pointer hover:shadow-md transition-all duration-300 group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${section.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${section.textColor} text-lg`}>
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {section.description}
                      </p>
                      {section.loading ? (
                        <p className="text-xs text-gray-500 mt-1">Yükleniyor...</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          {section.id === 'subscriptions' && `${section.count} aktif abonelik`}
                          {section.id === 'warranty' && `${section.count} aktif garanti`}
                          {section.id === 'cargo' && `${section.count} bekleyen kargo`}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${section.textColor} group-hover:translate-x-1 transition-transform duration-300`} />
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
};

export default EvimPage;