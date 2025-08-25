import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Upload } from 'lucide-react';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Warranty {
  id: string;
  productName: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyPeriod: number;
  warrantyEndDate: Date;
  category: string;
  purchasePrice: number;
  store?: string;
  invoiceUrl?: string;
  userId: string;
  createdAt: Date;
}

interface WarrantyFormProps {
  warranty?: Warranty | null;
  onClose: () => void;
  onSave: () => void;
}

export const WarrantyForm: React.FC<WarrantyFormProps> = ({ warranty, onClose, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyPeriod: 12,
    category: '',
    purchasePrice: '',
    store: '',
    invoiceUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Düzenleme modunda form verilerini doldur
  useEffect(() => {
    if (warranty) {
      const purchaseDate = warranty.purchaseDate instanceof Date 
        ? warranty.purchaseDate 
        : new Date(warranty.purchaseDate);
      
      setFormData({
        productName: warranty.productName,
        brand: warranty.brand,
        model: warranty.model || '',
        serialNumber: warranty.serialNumber || '',
        purchaseDate: purchaseDate.toISOString().split('T')[0],
        warrantyPeriod: warranty.warrantyPeriod,
        category: warranty.category,
        purchasePrice: warranty.purchasePrice.toString(),
        store: warranty.store || '',
        invoiceUrl: warranty.invoiceUrl || ''
      });
    }
  }, [warranty]);

  const categories = [
    'Elektronik',
    'Ev Aletleri',
    'Bilgisayar & Teknoloji',
    'Telefon & Tablet',
    'Otomotiv',
    'Mobilya',
    'Giyim & Aksesuar',
    'Spor & Outdoor',
    'Diğer'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let invoiceUrl = formData.invoiceUrl;
      
      // Fatura dosyası yükleme
      if (selectedFile) {
        setUploading(true);
        const fileRef = ref(storage, `invoices/${user.id}/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        invoiceUrl = await getDownloadURL(snapshot.ref);
        setUploading(false);
      }

      const purchaseDate = new Date(formData.purchaseDate);
      const warrantyEndDate = new Date(purchaseDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + formData.warrantyPeriod);

      const warrantyData = {
        ...formData,
        invoiceUrl,
        purchaseDate,
        warrantyEndDate,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        userId: user.id
      };

      if (warranty) {
        // Düzenleme modu - mevcut kaydı güncelle
        await updateDoc(doc(db, 'teknokapsul', user.id, 'warranties', warranty.id), warrantyData);
      } else {
        // Yeni kayıt ekleme
        await addDoc(collection(db, 'teknokapsul', user.id, 'warranties'), {
          ...warrantyData,
          createdAt: new Date()
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving warranty:', error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      // Dosya tipi kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Sadece JPG, PNG ve PDF dosyaları yüklenebilir.');
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{warranty ? 'Garanti Düzenle' : 'Yeni Garanti Ekle'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: '#ffb700' }} />
              Ürün Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Ürün adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Marka adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Model bilgisini girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seri Numarası
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Seri numarasını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Kategori seçin</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: '#ffb700' }} />
              Satın Alma Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satın Alma Tarihi *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garanti Süresi (Ay) *
                </label>
                <input
                  type="number"
                  name="warrantyPeriod"
                  value={formData.warrantyPeriod}
                  onChange={handleChange}
                  required
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satın Alma Fiyatı (₺)
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satın Alınan Mağaza
              </label>
              <input
                type="text"
                name="store"
                value={formData.store}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder="Mağaza adını girin"
              />
            </div>
          </div>

          {/* Invoice Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" style={{ color: '#ffb700' }} />
              Fatura Yükle
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Seçilen dosya: {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                JPG, PNG veya PDF formatında, maksimum 5MB boyutunda dosya yükleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => !(loading || uploading) && (e.currentTarget.style.backgroundColor = '#e6a500')}
              onMouseLeave={(e) => !(loading || uploading) && (e.currentTarget.style.backgroundColor = '#ffb700')}
            >
              {uploading ? 'Fatura Yükleniyor...' : loading ? 'Kaydediliyor...' : 'Garanti Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};