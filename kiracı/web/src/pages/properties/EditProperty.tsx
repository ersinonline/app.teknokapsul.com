import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

const EditProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [type, setType] = useState('residential');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [roomCount, setRoomCount] = useState('');
  const [floor, setFloor] = useState('');
  const [agentIdInput, setAgentIdInput] = useState('');
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permBusy, setPermBusy] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!user || !id) return;
      try {
        const docRef = doc(db, 'accounts', user.uid, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setType(data.type || 'residential');
          setCity(data.address?.city || '');
          setDistrict(data.address?.district || '');
          setAddress(data.address?.fullText || '');
          setRoomCount(data.meta?.roomCount || '');
          setFloor(data.meta?.floor || '');
        } else {
          setError('Taşınmaz bulunamadı.');
        }
      } catch (err) {
        console.error(err);
        setError('Taşınmaz bilgileri yüklenemedi.');
      } finally {
        setFetching(false);
      }
    };
    fetchProperty();
  }, [user, id]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user || !id) return;
      try {
        const permRef = collection(db, 'accounts', user.uid, 'properties', id, 'agent_permissions');
        const snap = await getDocs(permRef);
        setPermissions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch {
        setPermissions([]);
      }
    };
    fetchPermissions();
  }, [user, id]);

  const grantPermission = async () => {
    if (!user || !id || !agentIdInput.trim()) return;
    setPermBusy(true);
    try {
      const q = query(collectionGroup(db, 'members'), where('agentId', '==', agentIdInput.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Agent ID bulunamadı.');
        return;
      }
      const agentDoc = snap.docs[0];
      const agentData = agentDoc.data() as any;
      const agentUid = agentData.uid || agentDoc.id;
      const permRef = doc(db, 'accounts', user.uid, 'properties', id, 'agent_permissions', agentUid);
      await setDoc(
        permRef,
        {
          agentUid,
          agentId: agentData.agentId || agentIdInput.trim(),
          displayName: agentData.displayName || '',
          email: agentData.email || '',
          grantedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setAgentIdInput('');
      const fresh = await getDocs(collection(db, 'accounts', user.uid, 'properties', id, 'agent_permissions'));
      setPermissions(fresh.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setPermBusy(false);
    }
  };

  const revokePermission = async (agentUid: string) => {
    if (!user || !id) return;
    await deleteDoc(doc(db, 'accounts', user.uid, 'properties', id, 'agent_permissions', agentUid));
    setPermissions((prev) => prev.filter((p) => p.id !== agentUid));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const docRef = doc(db, 'accounts', user.uid, 'properties', id);
      await updateDoc(docRef, {
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
        updatedAt: serverTimestamp(),
      });
      navigate('/properties');
    } catch (err: any) {
      console.error(err);
      setError('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Taşınmazı Düzenle</h2>
          <p className="page-subtitle">Adres ve meta bilgilerini güncelleyin.</p>
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
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </form>
      </div>

      <div className="card p-8">
        <h3 className="text-lg font-semibold text-slate-900">Emlakçı Yetkileri</h3>
        <p className="mt-1 text-sm text-slate-500">
          Agent ID ile bu taşınmaza erişim verin. Emlakçı sadece bu evin sözleşmelerini görür.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={agentIdInput}
            onChange={(e) => setAgentIdInput(e.target.value)}
            className="form-input"
            placeholder="Agent ID (örn: AG-XXXXXXX)"
          />
          <button onClick={grantPermission} disabled={permBusy} className="btn btn-primary">
            Yetki Ver
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {permissions.length === 0 && <div className="text-sm text-slate-500">Henüz yetki verilmedi.</div>}
          {permissions.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm">
                <div className="font-semibold text-slate-900">{p.displayName || 'Emlakçı'}</div>
                <div className="text-slate-500">{p.email || p.agentId}</div>
              </div>
              <button onClick={() => revokePermission(p.id)} className="text-sm font-semibold text-red-600">
                Kaldır
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
