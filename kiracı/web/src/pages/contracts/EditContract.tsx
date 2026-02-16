import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '../../components/Toast';
import { formatIBAN, cleanIBAN, isValidIBAN, formatTCKN, isValidTCKN, isValidEmail, formatPhone, cleanPhone } from '../../utils/validators';

const EditContract: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [tenantName, setTenantName] = useState('');
  const [tenantTckn, setTenantTckn] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(true);
  const [iban, setIban] = useState('');
  const [receiverName, setReceiverName] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      if (!user || !id) return;
      try {
        const docRef = doc(db, 'accounts', user.uid, 'contracts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.status !== 'DRAFT_READY') {
            toast.error('Sadece taslak durumundaki sözleşmeler düzenlenebilir.');
            navigate(`/contracts/${id}`);
            return;
          }

          setTenantName(data.tenant?.name || '');
          setTenantTckn(data.tenant?.tckn || '');
          setTenantPhone(data.tenant?.phone || '');
          setTenantEmail(data.tenant?.email || '');
          setRentAmount(data.rentAmount || '');
          setDepositAmount(data.depositAmount || '');
          
          if (data.startDate) {
             const date = data.startDate.toDate();
             const yyyy = date.getFullYear();
             const mm = String(date.getMonth() + 1).padStart(2, '0');
             const dd = String(date.getDate()).padStart(2, '0');
             setStartDate(`${yyyy}-${mm}-${dd}`);
          }

          setPayDay(data.payDay || '1');
          setLateFeeEnabled(data.lateFeeEnabled ?? true);
          setIban(data.iban?.iban ? formatIBAN(data.iban.iban) : '');
          setReceiverName(data.iban?.receiverName || '');
        } else {
          setError('Sözleşme bulunamadı.');
        }
      } catch (err) {
        console.error(err);
        setError('Sözleşme bilgileri yüklenemedi.');
      } finally {
        setFetching(false);
      }
    };
    fetchContract();
  }, [user, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setLoading(true);
    setError('');

    try {
      const docRef = doc(db, 'accounts', user.uid, 'contracts', id);
      await updateDoc(docRef, {
        tenant: { name: tenantName, tckn: tenantTckn, phone: cleanPhone(tenantPhone), email: tenantEmail },
        rentAmount: Number(rentAmount),
        depositAmount: Number(depositAmount),
        startDate: Timestamp.fromDate(new Date(startDate)),
        payDay: Number(payDay),
        lateFeeEnabled,
        iban: { iban: cleanIBAN(iban), receiverName },
        updatedAt: serverTimestamp(),
      });
      toast.success('Sözleşme güncellendi.');
      navigate(`/contracts/${id}`);
    } catch (err: any) {
      console.error(err);
      setError('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title">Sözleşmeyi Düzenle</h2>
        <p className="page-subtitle">Sadece taslak aşamasındaki sözleşmeleri düzenleyebilirsiniz.</p>
      </div>

      <div className="card p-6 sm:p-8">
        {error && (
          <div className="card-muted border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Kiracı Bilgileri</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label">Ad Soyad</label>
                <input type="text" required value={tenantName} onChange={e => setTenantName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">TCKN</label>
                <input type="text" required value={tenantTckn} onChange={e => setTenantTckn(formatTCKN(e.target.value))} className={`form-input ${tenantTckn && !isValidTCKN(tenantTckn) ? 'border-red-300 focus:ring-red-500' : ''}`} placeholder="11111111111" />
                {tenantTckn && !isValidTCKN(tenantTckn) && <p className="text-xs text-red-500 mt-1">TCKN 11 haneli olmalıdır</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input type="tel" required value={tenantPhone} onChange={e => setTenantPhone(formatPhone(e.target.value))} className="form-input" placeholder="5XX XXX XX XX" />
              </div>
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input type="email" required value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} className={`form-input ${tenantEmail && !isValidEmail(tenantEmail) ? 'border-red-300 focus:ring-red-500' : ''}`} placeholder="ornek@email.com" />
                {tenantEmail && !isValidEmail(tenantEmail) && <p className="text-xs text-red-500 mt-1">Geçerli bir e-posta adresi girin</p>}
              </div>
            </div>
          </div>

          <div className="section-divider">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Kiralama Şartları</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label">Başlangıç Tarihi</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Ödeme Günü</label>
                <select value={payDay} onChange={e => setPayDay(e.target.value)} className="form-input">
                  {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kira Bedeli</label>
                <div className="relative">
                  <input type="number" required value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="form-input pr-12" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Depozito</label>
                <div className="relative">
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="form-input pr-12" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
                </div>
              </div>
            </div>
            
            <div className="mt-5 card-muted p-4 flex items-start gap-3">
              <input id="lateFee" type="checkbox" checked={lateFeeEnabled} onChange={e => setLateFeeEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 text-teal-600 border-slate-300 rounded" />
              <label htmlFor="lateFee" className="text-sm font-semibold text-slate-700 cursor-pointer">Gecikme faizi uygulansın</label>
            </div>
          </div>

          <div className="section-divider">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Ödeme Alıcı (IBAN)</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label">Alıcı Ad Soyad</label>
                <input type="text" required value={receiverName} onChange={e => setReceiverName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">IBAN</label>
                <input type="text" required value={iban} onChange={e => setIban(formatIBAN(e.target.value))} placeholder="TR00 0000 0000 0000 0000 0000 00" className={`form-input font-mono text-sm tracking-wide ${iban && !isValidIBAN(iban) ? 'border-red-300 focus:ring-red-500' : ''}`} />
                {iban && !isValidIBAN(iban) && <p className="text-xs text-red-500 mt-1">IBAN TR ile başlamalı ve 24 rakam içermelidir</p>}
              </div>
            </div>
          </div>

          <div className="section-divider flex justify-end gap-3">
            <button type="button" onClick={() => navigate(`/contracts/${id}`)} className="btn btn-secondary">İptal</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <><span className="spinner h-4 w-4" /> Kaydediliyor...</> : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContract;
