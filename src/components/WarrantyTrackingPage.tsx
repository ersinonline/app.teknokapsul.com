import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Package, Store, Trash2, Edit, AlertCircle, CheckCircle, Upload, Building } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Warranty {
  id?: string;
  productName: string;
  brand: string;
  purchaseDate: string;
  warrantyPeriod: number; // ay cinsinden
  store: string;
  platform: string;
  productType: string;
  invoiceUrl?: string;
  createdAt: Date;
}

const WarrantyTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<Warranty, 'id' | 'createdAt'>>({
    productName: '',
    brand: '',
    purchaseDate: '',
    warrantyPeriod: 12,
    store: '',
    platform: '',
    productType: '',
    invoiceUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);



  useEffect(() => {
    if (user) {
      fetchWarranties();
    }
  }, [user]);

  const fetchWarranties = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'users', user.id, 'warranties'),
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
      console.error('Garanti verileri alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    const fileRef = ref(storage, `warranties/${user.id}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setUploading(true);
      let invoiceUrl = formData.invoiceUrl;
      
      if (selectedFile) {
        invoiceUrl = await handleFileUpload(selectedFile);
      }

      const warrantyData = {
        ...formData,
        invoiceUrl,
        createdAt: new Date()
      };

      if (editingWarranty) {
        await updateDoc(doc(db, 'users', user.id, 'warranties', editingWarranty.id!), warrantyData);
      } else {
        await addDoc(collection(db, 'users', user.id, 'warranties'), warrantyData);
      }

      await fetchWarranties();
      resetForm();
    } catch (error) {
      console.error('Garanti kaydedilirken hata:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Bu garanti kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.id, 'warranties', id));
      await fetchWarranties();
    } catch (error) {
      console.error('Garanti silinirken hata:', error);
    }
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setFormData({
        productName: warranty.productName,
        brand: warranty.brand,
        purchaseDate: warranty.purchaseDate,
        warrantyPeriod: warranty.warrantyPeriod,
        store: warranty.store,
        platform: warranty.platform,
        productType: warranty.productType,
        invoiceUrl: warranty.invoiceUrl || ''
      });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      brand: '',
      purchaseDate: '',
      warrantyPeriod: 12,
      store: '',
      platform: '',
      productType: '',
      invoiceUrl: ''
    });
    setEditingWarranty(null);
    setIsModalOpen(false);
    setSelectedFile(null);
  };

  const getWarrantyStatus = (purchaseDate: string, warrantyPeriod: number) => {
    const purchase = new Date(purchaseDate);
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + warrantyPeriod);
    const today = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', daysLeft: 0, color: 'text-red-600' };
    } else if (daysLeft <= 30) {
      return { status: 'expiring', daysLeft, color: 'text-yellow-600' };
    } else {
      return { status: 'active', daysLeft, color: 'text-green-600' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Garanti Takibi</h1>
        <p className="text-gray-600">Ürünlerinizin garanti sürelerini takip edin ve zamanında hatırlatma alın.</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Garanti Ekle
        </button>
      </div>

      {warranties.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz garanti kaydınız yok</h3>
          <p className="text-gray-500 mb-4">İlk garanti kaydınızı ekleyerek başlayın.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Garanti Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warranties.map((warranty) => {
            const status = getWarrantyStatus(warranty.purchaseDate, warranty.warrantyPeriod);
            return (
              <div key={warranty.id} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{warranty.productName}</h3>
                    <p className="text-sm text-gray-500">{warranty.brand} • {warranty.productType}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(warranty)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(warranty.id!)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Satın Alma: {formatDate(warranty.purchaseDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4 text-gray-400" />
                    <span>{warranty.store}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{warranty.platform}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{warranty.warrantyPeriod} ay garanti</span>
                  </div>
                  {warranty.invoiceUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <a 
                        href={warranty.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Faturayı Görüntüle
                      </a>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-2 ${status.color}`}>
                  {status.status === 'expired' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {status.status === 'expired'
                      ? 'Garanti süresi doldu'
                      : status.status === 'expiring'
                      ? `${status.daysLeft} gün kaldı`
                      : `${status.daysLeft} gün kaldı`}
                  </span>
                </div>


              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingWarranty ? 'Garanti Düzenle' : 'Yeni Garanti Ekle'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ürün adını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ürün markasını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Türü *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ürün türünü girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Satın Alma Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Garanti Süresi (Ay) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData({ ...formData, warrantyPeriod: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mağaza/Satıcı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.store}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Mağaza adını girin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform *
                </label>
                <input
                  type="text"
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Satın alınan platform (örn: Trendyol, Hepsiburada, Fiziksel Mağaza)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatura
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {formData.invoiceUrl && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Upload className="w-4 h-4" />
                      <a 
                        href={formData.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Mevcut faturayı görüntüle
                      </a>
                    </div>
                  )}
                </div>
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Yükleniyor...
                    </>
                  ) : (
                    editingWarranty ? 'Güncelle' : 'Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyTrackingPage;