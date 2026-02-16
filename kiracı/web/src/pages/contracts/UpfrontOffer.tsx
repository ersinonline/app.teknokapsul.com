import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { addDoc, collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { toast } from '../../components/Toast';

const UpfrontOffer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [months, setMonths] = useState('6');
  const [offerAmount, setOfferAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [monthlyRent, setMonthlyRent] = useState(0);

  useEffect(() => {
    const fetchContract = async () => {
      if (!user || !id) return;
      // Try landlord path first
      const landlordRef = doc(db, 'accounts', user.uid, 'contracts', id);
      const landlordSnap = await getDoc(landlordRef);
      if (landlordSnap.exists()) {
        const data = landlordSnap.data() as any;
        setOwnerUid(user.uid);
        setMonthlyRent(Number(data.rentAmount || 0));
        return;
      }

      if (user.email) {
        const q = query(collectionGroup(db, 'contracts'), where('tenant.email', '==', user.email));
        const snap = await getDocs(q);
        let found: any = null;
        snap.forEach((d) => {
          if (d.id === id) found = d;
        });
        if (found) {
          const parts = found.ref.path.split('/');
          setOwnerUid(parts[1]);
          const data = found.data() as any;
          setMonthlyRent(Number(data.rentAmount || 0));
        }
      }
    };
    fetchContract();
  }, [user, id]);

  const totalBase = monthlyRent * Number(months);
  const minOffer = Math.ceil(totalBase * 0.90);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !ownerUid) return;
    setLoading(true);

    try {
      const offerRef = await addDoc(collection(db, 'accounts', ownerUid, 'contracts', id, 'upfront_offers'), {
        contractId: id,
        months: Number(months),
        baseTotal: totalBase,
        offerAmount: Number(offerAmount),
        status: 'OFFERED',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'accounts', ownerUid, 'contracts', id, 'requests'), {
        contractId: id,
        ownerUid,
        landlordUid: ownerUid,
        tenantEmail: user.email || null,
        fromRole: 'tenant',
        toRole: 'landlord',
        type: 'UPFRONT_OFFER',
        message: `Peşin ödeme teklifi: ${Number(offerAmount).toLocaleString()} TL (${months} ay)`,
        status: 'PENDING',
        offerId: offerRef.id,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Teklif başarıyla oluşturuldu!');
      navigate(`/contracts/${id}`);
    } catch (error) {
      console.error(error);
      toast.error('Teklif oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="page-title">Peşin Ödeme Teklifi Oluştur</h2>
        <p className="page-subtitle">Ödenmemiş aylar için toplu teklifinizi oluşturun.</p>
      </div>

      <div className="card-muted p-4">
        <p className="text-sm text-slate-700">
          Peşin ödemelerde maksimum %10 indirim teklif edebilirsiniz.
          Ev sahibi kabul ederse 1 hafta içinde ödeme yapmanız gerekir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="form-label">Kaç aylık peşin ödeyeceksiniz?</label>
          <select 
            value={months} 
            onChange={(e) => setMonths(e.target.value)}
            className="form-input"
          >
            <option value="3">3 Ay</option>
            <option value="6">6 Ay</option>
            <option value="12">12 Ay (1 Yıl)</option>
          </select>
        </div>

        <div className="card-muted p-4">
          <p className="text-sm text-slate-600">Normal Toplam: <strong>{totalBase.toLocaleString()} TL</strong></p>
          <p className="text-sm text-slate-600">Minimum Teklif Edebileceğiniz: <strong>{minOffer.toLocaleString()} TL</strong> (%10 indirimli)</p>
        </div>

        <div>
          <label className="form-label">Teklifiniz (TL)</label>
          <input 
            type="number" 
            required 
            min={minOffer}
            max={totalBase}
            value={offerAmount} 
            onChange={(e) => setOfferAmount(e.target.value)} 
            className="form-input" 
          />
          <p className="mt-1 text-xs text-slate-500">
            {offerAmount && Number(offerAmount) < minOffer ? 'Teklifiniz minimum tutarın altında.' : ''}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading || (Number(offerAmount) < minOffer)}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Gönderiliyor...' : 'Teklifi Gönder'}
        </button>
      </form>
    </div>
  );
};

export default UpfrontOffer;
