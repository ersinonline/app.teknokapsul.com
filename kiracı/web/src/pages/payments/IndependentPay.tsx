import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../firebase';
import { toast } from '../../components/Toast';
import { formatIBAN, cleanIBAN, isValidIBAN } from '../../utils/validators';

const IndependentPay: React.FC = () => {
  const { user } = useAuth();
  const [landlordName, setLandlordName] = useState('');
  const [landlordIban, setLandlordIban] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paying, setPaying] = useState(false);

  const rent = Number(rentAmount) || 0;
  const commission = Math.round(rent * 0.10);
  const total = rent + commission;

  const handlePay = async () => {
    if (!user || rent <= 0) return;
    setPaying(true);
    try {
      // Create standalone invoice record
      const invoiceRef = await addDoc(collection(db, 'accounts', user.uid, 'standalone_payments'), {
        type: 'INDEPENDENT',
        tenantUid: user.uid,
        tenantEmail: user.email,
        landlordName,
        landlordIban,
        rentAmount: rent,
        commission,
        totalPaid: total,
        description,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });

      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast.error('Oturum bulunamadı.'); return; }

      const resp = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createIndependentCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paymentId: invoiceRef.id,
          rentAmount: rent,
          landlordName,
          landlordIban: cleanIBAN(landlordIban),
          description,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data?.error || 'Ödeme başlatılamadı.'); return; }
      const url = data?.paymentPageUrl as string | undefined;
      if (!url) { toast.error('Ödeme sayfası oluşturulamadı.'); return; }
      window.location.href = url;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Ödeme başlatılamadı.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Bağımsız Kira Ödemesi</h1>
        <p className="page-subtitle">Ev sahibiniz bu sistemi kullanmıyor olsa bile kiranızı kredi kartıyla ödeyebilirsiniz.</p>
      </div>

      <div className="card-muted p-4">
        <p className="text-sm text-slate-700">
          Bu modda <strong>%10 komisyon</strong> uygulanır. Erken ödeme indirimi geçerli değildir.
          Ödemeniz bize ulaştıktan sonra ev sahibinize IBAN üzerinden aktarılır.
        </p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="form-group">
            <label className="form-label">Ev Sahibi Ad Soyad</label>
            <input
              type="text"
              required
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
              className="form-input"
              placeholder="Ahmet Yılmaz"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ev Sahibi IBAN</label>
            <input
              type="text"
              required
              value={landlordIban}
              onChange={(e) => setLandlordIban(formatIBAN(e.target.value))}
              className={`form-input font-mono text-sm tracking-wide ${landlordIban && !isValidIBAN(landlordIban) ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
            {landlordIban && !isValidIBAN(landlordIban) && <p className="text-xs text-red-500 mt-1">IBAN TR ile başlamalı ve 24 rakam içermelidir</p>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Aylık Kira Tutarı</label>
          <div className="relative">
            <input
              type="number"
              required
              min={1}
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="form-input pr-12"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Açıklama (opsiyonel)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            placeholder="Örn: Ocak 2026 kirası"
          />
        </div>

        {rent > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Kira Tutarı</span>
              <span className="font-semibold text-slate-900">{rent.toLocaleString()} ₺</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Komisyon (%10)</span>
              <span className="font-semibold text-slate-900">{commission.toLocaleString()} ₺</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-slate-900 font-bold">Toplam Ödeme</span>
              <span className="text-lg font-bold text-teal-700">{total.toLocaleString()} ₺</span>
            </div>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying || rent <= 0 || !landlordName.trim() || !isValidIBAN(landlordIban)}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {paying ? (
            <span className="flex items-center justify-center gap-2"><span className="spinner h-4 w-4" /> Yönlendiriliyor…</span>
          ) : `${total > 0 ? total.toLocaleString() + ' ₺ ' : ''}Öde`}
        </button>
      </div>
    </div>
  );
};

export default IndependentPay;
