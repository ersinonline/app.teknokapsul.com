import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toast';

const NewProperty: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState('residential');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [roomCount, setRoomCount] = useState('');
  const [floor, setFloor] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'accounts', user.uid, 'properties'), {
        ownerUid: user.uid,
        createdByUid: user.uid,
        type,
        address: {
          city,
          district,
          fullText: address,
        },
        meta: {
          roomCount,
          floor,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Taşınmaz başarıyla eklendi!');
      navigate('/properties');
    } catch (err: any) {
      console.error(err);
      setError('Taşınmaz eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Yeni Taşınmaz Ekle</h2>
          <p className="page-subtitle">Kiralayacağınız konut veya işyeri bilgilerini girin.</p>
        </div>
      </div>

      <div className="card p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Type Section */}
            <div>
              <label className="form-label text-base">Mülk Tipi</label>
              <p className="form-hint">Bu mülkü ne amaçla kiralayacaksınız?</p>
              <fieldset className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`relative rounded-xl border p-4 flex cursor-pointer focus:outline-none ${type === 'residential' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-400' : 'border-slate-200'}`} onClick={() => setType('residential')}>
                    <div className="flex items-center">
                       <input type="radio" name="property-type" value="residential" checked={type === 'residential'} onChange={() => setType('residential')} className="h-4 w-4 text-emerald-600 border-gray-300" />
                       <label className="ml-3 block text-sm font-medium text-slate-900 cursor-pointer">
                         Konut / Daire
                       </label>
                    </div>
                  </div>
                  <div className={`relative rounded-xl border p-4 flex cursor-pointer focus:outline-none ${type === 'commercial' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-400' : 'border-slate-200'}`} onClick={() => setType('commercial')}>
                    <div className="flex items-center">
                       <input type="radio" name="property-type" value="commercial" checked={type === 'commercial'} onChange={() => setType('commercial')} className="h-4 w-4 text-emerald-600 border-gray-300" />
                       <label className="ml-3 block text-sm font-medium text-slate-900 cursor-pointer">
                         İşyeri / Ofis
                       </label>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="city" className="form-label">Şehir</label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-input"
                  placeholder="Örn: İstanbul"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="district" className="form-label">İlçe</label>
                <input
                  type="text"
                  name="district"
                  id="district"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="form-input"
                  placeholder="Örn: Kadıköy"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="form-label">Açık Adres</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                placeholder="Mahalle, Cadde, Sokak, Bina No, Daire No..."
              />
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 card-muted p-4">
              <div className="space-y-2">
                <label htmlFor="roomCount" className="form-label">Oda Sayısı</label>
                <input
                  type="text"
                  name="roomCount"
                  id="roomCount"
                  value={roomCount}
                  onChange={(e) => setRoomCount(e.target.value)}
                  className="form-input"
                  placeholder="Örn: 3+1"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="floor" className="form-label">Bulunduğu Kat</label>
                <input
                  type="text"
                  name="floor"
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="form-input"
                  placeholder="Örn: 5"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/properties')}
                  className="btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? <><span className="spinner h-4 w-4" /> Kaydediliyor...</> : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
      </div>
    </div>
  );
};

export default NewProperty;
