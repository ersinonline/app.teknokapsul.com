import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEkira } from './context/EkiraContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Save, Loader2, Home, User, Calendar, DollarSign } from 'lucide-react';

const EkiraNewContract: React.FC = () => {
  const navigate = useNavigate();
  const { uid, displayName } = useEkira();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    propertyName: '',
    propertyAddress: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    tenantTckn: '',
    monthlyRent: '',
    depositAmount: '',
    startDate: '',
    endDate: '',
    paymentDay: '1',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    if (!form.propertyName || !form.tenantName || !form.monthlyRent || !form.startDate || !form.endDate) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const contractData = {
        landlordId: uid,
        landlordName: displayName || '',
        propertyName: form.propertyName,
        propertyAddress: form.propertyAddress,
        tenantName: form.tenantName,
        tenantEmail: form.tenantEmail,
        tenantPhone: form.tenantPhone,
        tenantTckn: form.tenantTckn,
        monthlyRent: parseFloat(form.monthlyRent),
        depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : 0,
        startDate: Timestamp.fromDate(new Date(form.startDate)),
        endDate: Timestamp.fromDate(new Date(form.endDate)),
        paymentDay: parseInt(form.paymentDay),
        notes: form.notes,
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'ekira_contracts'), contractData);
      navigate('/ekira/contracts');
    } catch (err: any) {
      console.error('Sözleşme oluşturma hatası:', err);
      setError('Sözleşme oluşturulurken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container bg-background">
      <div className="bank-gradient-green px-4 pt-4 pb-8">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/ekira/contracts')} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Yeni Sözleşme</h1>
              <p className="text-white/60 text-xs">Kira sözleşmesi oluşturun</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-4 mb-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mülk Bilgileri */}
          <div className="bank-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">Mülk Bilgileri</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Mülk Adı *</label>
                <input name="propertyName" value={form.propertyName} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  placeholder="Örn: Kadıköy 2+1 Daire" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Adres</label>
                <input name="propertyAddress" value={form.propertyAddress} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  placeholder="Tam adres" />
              </div>
            </div>
          </div>

          {/* Kiracı Bilgileri */}
          <div className="bank-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-foreground">Kiracı Bilgileri</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Kiracı Adı *</label>
                <input name="tenantName" value={form.tenantName} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="Ad Soyad" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">E-posta</label>
                  <input name="tenantEmail" type="email" value={form.tenantEmail} onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                    placeholder="email@ornek.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefon</label>
                  <input name="tenantPhone" value={form.tenantPhone} onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                    placeholder="05XX XXX XX XX" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">TC Kimlik No</label>
                <input name="tenantTckn" value={form.tenantTckn} onChange={handleChange} maxLength={11}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="XXXXXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Ödeme Bilgileri */}
          <div className="bank-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-foreground">Ödeme Bilgileri</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Aylık Kira *</label>
                  <input name="monthlyRent" type="number" value={form.monthlyRent} onChange={handleChange} required
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" 
                    placeholder="₺" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Depozito</label>
                  <input name="depositAmount" type="number" value={form.depositAmount} onChange={handleChange}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" 
                    placeholder="₺" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Ödeme Günü</label>
                <select name="paymentDay" value={form.paymentDay} onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Her ayın {day}. günü</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sözleşme Tarihleri */}
          <div className="bank-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-foreground">Sözleşme Tarihleri</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Başlangıç *</label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bitiş *</label>
                <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="bank-card p-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notlar</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              placeholder="Ek notlar..." />
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Kaydediliyor...' : 'Sözleşme Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EkiraNewContract;
