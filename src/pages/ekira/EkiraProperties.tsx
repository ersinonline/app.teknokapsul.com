import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Property {
  id: string;
  title: string;
  type: string;
  address: string;
  city: string;
  district: string;
  rooms?: string;
  area?: number;
  createdAt?: any;
}

const EkiraProperties: React.FC = () => {
  const { uid } = useEkira();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'konut', address: '', city: '', district: '', rooms: '', area: '' });

  useEffect(() => {
    if (uid) loadProperties();
  }, [uid]);

  const loadProperties = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'accounts', uid, 'properties'));
      setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property)));
    } catch (error) {
      console.error('Taşınmazlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!uid || !form.title || !form.city) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }
    try {
      await addDoc(collection(db, 'accounts', uid, 'properties'), {
        ...form,
        area: form.area ? Number(form.area) : null,
        createdAt: serverTimestamp()
      });
      setForm({ title: '', type: 'konut', address: '', city: '', district: '', rooms: '', area: '' });
      setShowAdd(false);
      await loadProperties();
    } catch (error) {
      console.error('Taşınmaz eklenirken hata:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!uid || !confirm('Bu taşınmazı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'accounts', uid, 'properties', id));
      await loadProperties();
    } catch (error) {
      console.error('Taşınmaz silinirken hata:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Taşınmazlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      <div className="bank-gradient-green px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/ekira')} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white rotate-180" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Taşınmazlarım</h1>
                <p className="text-white/60 text-xs">{properties.length} taşınmaz</p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
        {showAdd && (
          <div className="bank-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Yeni Taşınmaz Ekle</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Taşınmaz Adı *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="konut">Konut</option>
                <option value="isyeri">İşyeri</option>
                <option value="arsa">Arsa</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Şehir *"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="İlçe"
                  value={form.district}
                  onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <input
                type="text"
                placeholder="Adres"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Oda Sayısı"
                  value={form.rooms}
                  onChange={e => setForm(p => ({ ...p, rooms: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  placeholder="m²"
                  value={form.area}
                  onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-medium">
                  Ekle
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-xs font-medium">
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="bank-card p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-3">Henüz taşınmaz eklenmemiş.</p>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-medium">
              İlk Taşınmazı Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map(prop => (
              <div key={prop.id} className="bank-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <h4 className="font-semibold text-foreground text-sm truncate">{prop.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{[prop.district, prop.city].filter(Boolean).join(', ') || 'Adres belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-muted rounded">{prop.type === 'konut' ? 'Konut' : prop.type === 'isyeri' ? 'İşyeri' : 'Arsa'}</span>
                      {prop.rooms && <span>{prop.rooms} oda</span>}
                      {prop.area && <span>{prop.area} m²</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(prop.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EkiraProperties;
