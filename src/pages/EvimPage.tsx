import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Zap, Shield, Truck, Building2 } from 'lucide-react';
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
      const cargos = await getUserCargoTrackings(user.uid);
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
        collection(db, 'teknokapsul', user.uid, 'warranties'),
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
    },
    {
      id: 'ekira',
      title: 'eKira',
      description: 'Kira sözleşmeleri ve tahsilat yönetimi',
      icon: Building2,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      route: '/ekira',
      count: 0,
      loading: false,
      items: []
    }
  ];

  const handleSectionClick = (route: string) => {
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Evim</h1>
              <p className="text-white/60 text-xs">Ev yönetimi ve takip</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sections.map((section) => (
              <div key={section.id} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">
                  {section.loading ? '...' : section.count}
                </p>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">
                  {section.id === 'subscriptions' ? 'Abonelik' : section.id === 'warranty' ? 'Garanti' : 'Kargo'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="page-content -mt-5">
        <div className="bank-card p-1 mb-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.route)}
                className="menu-item w-full"
              >
                <div className={`menu-icon ${section.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${section.textColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!section.loading && section.count > 0 && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {section.count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvimPage;