import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, collectionGroup, doc, getDoc, getDocs, addDoc, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '../../components/Toast';
import { formatIBAN, cleanIBAN, isValidIBAN, formatTCKN, isValidTCKN, isValidEmail, formatPhone, cleanPhone } from '../../utils/validators';

type RoleChoice = null | 'landlord' | 'tenant';

const LANDLORD_STEPS = ['Kiracı Bilgileri', 'Taşınmaz', 'Şartlar', 'Demirbaş & Maddeler', 'Onay'];

const DEFAULT_CLAUSES = [
  'Kiracı; ısıtma, aydınlatma, su vb. tüm kullanım giderlerini öder.',
  'Kiralananı teslim aldığı durumda geri verir; olağan kullanımdan doğan eskimelerden sorumlu değildir.',
  'Kiralananı sözleşmeye uygun ve özenli kullanmak zorundadır.',
  'Komşulara ve apartman sakinlerine saygılı davranmakla yükümlüdür.',
  'Kullanım amacını (konut) değiştiremez.',
  'Kiraya veren, teslimde ayıp/eksikleri yazılı bildirmezse kiracı sorumluluktan kurtulur (gizli ayıplar hariç).',
  'Yazılı izin olmadan başkasına kiralayamaz veya devredemez.',
  'Üçüncü kişilerin hak iddialarında kiraya veren davayı üstlenir ve zararı giderir.',
  'Düzenlenmeyen hususlarda TBK, KMK ve ilgili mevzuat uygulanır.',
  'Ortak alan/tesislerin onarımı için gerekli hallerde kiracı izin vermek zorundadır.',
  'Yönetim ve ortak gider bildirimlerini kiraya verene iletir.',
  'Kat malikleri kurulu kararları uyarınca yapılacak işlere izin verir.',
  'Zorunlu onarım/incelemeler için bağımsız bölüme girişe izin verir.',
  'Yazılı izin olmadan değişiklik yapamaz; zararı karşılar.',
  'Olağan temizlik ve bakım giderlerini öder.',
  'Kendisinin gidermekle yükümlü olmadığı ayıpları derhal bildirir.',
  'Ayıp giderme ve zarar önleme çalışmalarına katlanır (önceden bildirim şartıyla).',
  'Satış/bakım/yeniden kiralama için gezmeye izin verir (önceden bildirim).',
  'Tahliyede profesyonel temizlik ve gerekirse boya bedeli kiracıya aittir.',
  'Tüm abonelikler kiracı adına açılır/kapatılır; borçlardan kiracı sorumludur.',
  'Airbnb/günlük/oda kiralama yasaktır; ihlalde derhal fesih ve 3 aylık kira cezai şartı vardır.',
  'Depozito, kontroller sonrası en geç 30 gün içinde iade edilir; hasar varsa kesinti yapılır.',
  'Süre dolmadan tahliyede, yeniden kiralanana kadar en fazla 2 aylık kira zararını öder.',
  'Kefalet müteselsildir; kefil tüm borçlardan kiracıyla birlikte sorumludur.',
  'Kira vadesinde ödenmez ve gecikme 15 günü aşarsa kiraya veren feshedebilir.',
  'Gürültü/huzursuzlukta derhal ve haklı nedenle fesih mümkündür.',
  'Kasıt/ağır ihmal zararları 7 gün içinde giderilir; aksi halde bedeli talep edilir ve fesih olabilir.',
  'Teslimde tüm demirbaşların çalışır olduğu kabul edilir; tespit edilen giderler derhal ödenir veya depodan mahsup edilir.',
  'Yazılı izin olmadan sürekli ikamet edecek başka kişi yerleştirilemez.',
  'Tahliyede anahtar imza karşılığı teslim edilmedikçe tahliye geçerli sayılmaz.',
  'Aidat ve tüm ortak giderler kiracıya aittir; aidat borcu sözleşme ihlalidir.',
  'Tahliye öncesi tüm fatura/aidatlar kapatılır; çıkarsa ödenen tutarlar + %10 işletme gideri ile kiracıya rücu edilir.',
];
const TENANT_STEPS = ['Ev Sahibi Bilgileri', 'Kira Bilgileri', 'Onay'];

const NewContract: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [roleChoice, setRoleChoice] = useState<RoleChoice>(null);
  const [inviteChoice, setInviteChoice] = useState<null | 'yes' | 'no'>(null);

  const [properties, setProperties] = useState<any[]>([]);
  const [activePropertyIds, setActivePropertyIds] = useState<Set<string>>(new Set());
  const [memberData, setMemberData] = useState<any>(null);
  
  const [tenantName, setTenantName] = useState('');
  const [tenantTckn, setTenantTckn] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [agentOptions, setAgentOptions] = useState<any[]>([]);
  const [selectedAgentUid, setSelectedAgentUid] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(true);
  
  const [iban, setIban] = useState('');
  const [receiverName, setReceiverName] = useState('');

  // Demirbaş
  const [fixtures, setFixtures] = useState<Array<{name: string; condition: string}>>([]);
  const [newFixtureName, setNewFixtureName] = useState('');
  const [newFixtureCondition, setNewFixtureCondition] = useState('iyi');

  // Sözleşme Maddeleri
  const [selectedClauses, setSelectedClauses] = useState<Set<number>>(new Set());
  const [customClauses, setCustomClauses] = useState<string[]>([]);
  const [newCustomClause, setNewCustomClause] = useState('');

  const [landlordName, setLandlordName] = useState('');
  const [landlordIban, setLandlordIban] = useState('');
  const [tenantRentAmount, setTenantRentAmount] = useState('');
  const [tenantPayDay, setTenantPayDay] = useState('1');
  const [tenantStartDate, setTenantStartDate] = useState('');

  useEffect(() => {
    const fetchMember = async () => {
      if (!user) return;
      const memberRef = doc(db, 'accounts', user.uid, 'members', user.uid);
      const snap = await getDoc(memberRef);
      setMemberData(snap.exists() ? snap.data() : null);
    };
    fetchMember();
  }, [user]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;
      const list: any[] = [];
      const ownRef = collection(db, 'accounts', user.uid, 'properties');
      const ownSnap = await getDocs(ownRef);
      ownSnap.docs.forEach((d) => list.push({ id: d.id, ownerUid: user.uid, ...d.data() }));

      if (memberData?.roles?.agent) {
        const permQ = query(collectionGroup(db, 'agent_permissions'), where('agentUid', '==', user.uid));
        const permSnap = await getDocs(permQ);
        for (const perm of permSnap.docs) {
          const parts = perm.ref.path.split('/');
          const ownerUid = parts[1];
          const propertyId = parts[3];
          const propRef = doc(db, 'accounts', ownerUid, 'properties', propertyId);
          const propSnap = await getDoc(propRef);
          if (propSnap.exists()) {
            if (!list.find((p) => p.id === propSnap.id && p.ownerUid === ownerUid)) {
              list.push({ id: propSnap.id, ownerUid, ...(propSnap.data() as any) });
            }
          }
        }
      }

      setProperties(list);

      // Check which properties already have active contracts
      const activeIds = new Set<string>();
      const contractsSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
      contractsSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.propertyId && ['DRAFT_READY', 'EDEVLET_APPROVED', 'ACTIVE'].includes(data.status)) {
          activeIds.add(data.propertyId);
        }
      });
      setActivePropertyIds(activeIds);
    };
    fetchProperties();
  }, [user, memberData]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user || !selectedPropertyId) {
        setAgentOptions([]);
        setSelectedAgentUid('');
        return;
      }
      try {
        const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
        const ownerUid = selectedProperty?.ownerUid || user.uid;
        const permRef = collection(db, 'accounts', ownerUid, 'properties', selectedPropertyId, 'agent_permissions');
        const snap = await getDocs(permRef);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setAgentOptions(list);
        setSelectedAgentUid('');
      } catch {
        setAgentOptions([]);
        setSelectedAgentUid('');
      }
    };
    fetchAgents();
  }, [user, selectedPropertyId, properties]);

  // Landlord flow submit
  const handleLandlordSubmit = async () => {
    if (!user) return;
    if (activePropertyIds.has(selectedPropertyId)) {
      toast.error('Bu taşınmaz için zaten aktif bir sözleşme var.');
      return;
    }
    setLoading(true);
    try {
      const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
      const ownerUid = selectedProperty?.ownerUid || user.uid;
      await addDoc(collection(db, 'accounts', ownerUid, 'contracts'), {
        status: 'DRAFT_READY',
        mode: 'STANDARD',
        createdByUid: user.uid,
        landlordUid: ownerUid,
        propertyId: selectedPropertyId,
        agentUid: selectedAgentUid || (memberData?.roles?.agent ? user.uid : null),
        tenant: { name: tenantName, tckn: tenantTckn, phone: cleanPhone(tenantPhone), email: tenantEmail },
        rentAmount: Number(rentAmount),
        depositAmount: Number(rentAmount) * 3,
        startDate: Timestamp.fromDate(new Date(startDate)),
        payDay: Number(payDay),
        lateFeeEnabled,
        iban: { iban: cleanIBAN(iban), receiverName },
        fixtures: fixtures.length > 0 ? fixtures : [],
        clauses: [
          ...Array.from(selectedClauses).sort((a, b) => a - b).map(i => DEFAULT_CLAUSES[i]),
          ...customClauses,
        ],
        termsVersion: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        flags: { hasRed: false }
      });
      toast.success('Sözleşme başarıyla oluşturuldu!');
      navigate('/contracts');
    } catch (error) {
      console.error(error);
      toast.error('Sözleşme oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Tenant (independent) flow submit
  const handleTenantSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'accounts', user.uid, 'contracts'), {
        status: 'ACTIVE',
        mode: 'INDEPENDENT',
        createdByUid: user.uid,
        landlordUid: user.uid,
        tenantUid: user.uid,
        tenant: { name: user.displayName || '', email: user.email || '' },
        landlord: { name: landlordName, iban: cleanIBAN(landlordIban) },
        rentAmount: Number(tenantRentAmount),
        depositAmount: 0,
        startDate: tenantStartDate ? Timestamp.fromDate(new Date(tenantStartDate)) : serverTimestamp(),
        payDay: Number(tenantPayDay),
        lateFeeEnabled: false,
        commissionRate: 0.10,
        iban: { iban: cleanIBAN(landlordIban), receiverName: landlordName },
        termsVersion: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        flags: { hasRed: false }
      });
      toast.success('Sözleşme oluşturuldu! Artık kiranızı kredi kartıyla ödeyebilirsiniz.');
      navigate('/contracts');
    } catch (error) {
      console.error(error);
      toast.error('Sözleşme oluşturulurken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const currentSteps = roleChoice === 'tenant' ? TENANT_STEPS : LANDLORD_STEPS;

  const renderStepIndicator = () => {
    if (step === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {currentSteps.map((label: string, idx: number) => {
            const num = idx + 1;
            const done = num < step;
            const current = num === step;
            return (
              <React.Fragment key={num}>
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 mx-2 sm:mx-4 rounded-full transition-colors ${done ? 'bg-teal-500' : 'bg-slate-200'}`} />
                )}
                <button
                  onClick={() => num < step && setStep(num)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <span className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${done ? 'bg-teal-600 text-white shadow-md' : current ? 'border-2 border-teal-600 text-teal-700 bg-white shadow-sm' : 'border-2 border-slate-200 text-slate-400 bg-white'}`}>
                    {done ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : num}
                  </span>
                  <span className={`text-xs font-semibold hidden sm:block ${current ? 'text-teal-700' : done ? 'text-teal-600' : 'text-slate-400'}`}>{label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Step 0: Role Selection ───
  const renderRoleSelection = () => {
    if (roleChoice === 'tenant' && inviteChoice === null) {
      return (
        <div className="space-y-6">
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ev sahibinizi davet etmek ister misiniz?</h3>
            <p className="text-sm text-slate-500 mb-6">Ev sahibiniz de eKira kullanıyorsa sözleşmeyi onun oluşturması daha uygun olacaktır.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setInviteChoice('yes')} className="rounded-2xl border-2 border-slate-200 p-5 text-left hover:border-teal-400 hover:bg-teal-50/50 transition-all">
                <h4 className="text-base font-bold text-slate-900">Evet, davet et</h4>
                <p className="text-sm text-slate-500 mt-1">Ev sahibime bilgi gönderilsin.</p>
              </button>
              <button onClick={() => { setInviteChoice('no'); setStep(1); }} className="rounded-2xl border-2 border-slate-200 p-5 text-left hover:border-sky-400 hover:bg-sky-50/50 transition-all">
                <h4 className="text-base font-bold text-slate-900">Hayır, kendim oluşturacağım</h4>
                <p className="text-sm text-slate-500 mt-1">Ev sahibi bilgilerini girerek devam et.</p>
              </button>
            </div>
          </div>
          <button onClick={() => { setRoleChoice(null); setInviteChoice(null); }} className="btn btn-ghost">← Geri</button>
        </div>
      );
    }

    if (roleChoice === 'tenant' && inviteChoice === 'yes') {
      return (
        <div className="space-y-6">
          <div className="card border border-sky-200 bg-sky-50/60 p-6 sm:p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 mx-auto mb-4">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-sky-900">Sözleşmeyi ev sahibinin oluşturması gerekmektedir</h3>
            <p className="text-sm text-sky-700 mt-2 max-w-md mx-auto">
              Ev sahibinize eKira&apos;yı tanıtın ve sözleşmeyi onun oluşturmasını isteyin. Ev sahibi sözleşmeyi oluşturduğunda, sizin e-posta adresinizle eşleştirilecektir.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/dashboard" className="btn btn-primary">Ana Sayfaya Dön</Link>
              <button onClick={() => { setInviteChoice(null); }} className="btn btn-ghost">← Geri</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Siz kimsiniz?</h3>
          <p className="text-sm text-slate-500 mb-6">Sözleşme oluşturma sürecinde rolünüzü seçin.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => { setRoleChoice('landlord'); setInviteChoice(null); setStep(1); }} className="rounded-2xl border-2 border-slate-200 p-6 text-left hover:border-teal-400 hover:bg-teal-50/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900">Ev Sahibiyim</h4>
              <p className="text-sm text-slate-500 mt-1">Kiracıma sözleşme oluşturmak istiyorum.</p>
            </button>
            <button onClick={() => { setRoleChoice('tenant'); setInviteChoice(null); }} className="rounded-2xl border-2 border-slate-200 p-6 text-left hover:border-sky-400 hover:bg-sky-50/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900">Kiracıyım</h4>
              <p className="text-sm text-slate-500 mt-1">Kiramı kredi kartıyla ödemek istiyorum.</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Landlord Step 1: Tenant Info ───
  const renderLandlordStep1 = () => (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-info">Adım 1</span>
          <h3 className="text-lg font-semibold text-slate-900">Kiracı Bilgileri</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Sözleşme yapılacak kiracının kimlik ve iletişim bilgilerini girin.
          <span className="block mt-1.5 text-teal-600 text-xs font-semibold">Kiracı bu e-posta adresiyle sisteme giriş yaptığında sözleşmeyi otomatik görebilecektir.</span>
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="form-group">
            <label className="form-label">Ad Soyad</label>
            <input type="text" required value={tenantName} onChange={e => setTenantName(e.target.value)} className="form-input" placeholder="Ahmet Yılmaz" />
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
      <div className="flex justify-between">
        <button onClick={() => { setStep(0); setRoleChoice(null); }} className="btn btn-ghost">← Geri</button>
        <button onClick={() => setStep(2)} disabled={!tenantName || !isValidEmail(tenantEmail) || (tenantTckn !== '' && !isValidTCKN(tenantTckn))} className="btn btn-primary">Devam Et →</button>
      </div>
    </div>
  );

  // ─── Landlord Step 2: Property Selection ───
  const renderLandlordStep2 = () => (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-info">Adım 2</span>
          <h3 className="text-lg font-semibold text-slate-900">Taşınmaz Seçimi</h3>
        </div>
        {properties.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
            </svg>
            <p className="empty-state-title">Taşınmaz bulunamadı</p>
            <p className="empty-state-text">Sözleşme oluşturmak için önce bir taşınmaz eklemelisiniz.</p>
            <button onClick={() => navigate('/properties/new')} className="btn btn-primary mt-4">Yeni Taşınmaz Ekle</button>
          </div>
        ) : (
          <div>
            <label className="form-label mb-3">Kiralanacak Mülk</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {properties.map(p => {
                const isActive = activePropertyIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => !isActive && setSelectedPropertyId(p.id)}
                    className={`relative rounded-2xl border p-4 transition-all ${isActive ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50/30' : selectedPropertyId === p.id ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/50 cursor-pointer' : 'border-slate-200 hover:border-teal-300 hover:shadow-sm cursor-pointer'}`}
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">{p.address.city} / {p.address.district}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.address.fullText}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`badge ${p.type === 'residential' ? 'badge-success' : 'badge-info'}`}>
                        {p.type === 'residential' ? 'Konut' : 'İşyeri'}
                      </span>
                      {isActive && <span className="badge badge-danger text-[10px]">Aktif Kiralama Var</span>}
                      {!isActive && selectedPropertyId === p.id && (
                        <svg className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {selectedPropertyId && agentOptions.length > 0 && (
          <div className="mt-6 form-group">
            <label className="form-label">Emlakçı (opsiyonel)</label>
            <select value={selectedAgentUid} onChange={(e) => setSelectedAgentUid(e.target.value)} className="form-input">
              <option value="">Seçim yapma</option>
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.displayName || 'Emlakçı'} {agent.agentId ? `(${agent.agentId})` : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(1)} className="btn btn-ghost">← Geri</button>
        <button onClick={() => setStep(3)} disabled={!selectedPropertyId} className="btn btn-primary">Devam Et →</button>
      </div>
    </div>
  );

  // ─── Landlord Step 3: Terms ───
  const renderLandlordStep3 = () => (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-info">Adım 3</span>
          <h3 className="text-lg font-semibold text-slate-900">Sözleşme Şartları</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="form-group">
            <label className="form-label">Başlangıç Tarihi</label>
            <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Ödeme Günü (Ayın kaçı?)</label>
            <select value={payDay} onChange={e => setPayDay(e.target.value)} className="form-input">
              {Array.from({length: 30}, (_, i) => i + 1).map(d => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Aylık Kira Bedeli</label>
            <div className="relative">
              <input type="number" required value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="form-input pr-12" placeholder="0" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Depozito (3 kira tutarı)</label>
            <div className="relative">
              <input type="number" value={rentAmount ? String(Number(rentAmount) * 3) : ''} readOnly className="form-input pr-12 bg-slate-50 cursor-not-allowed" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
            </div>
            {rentAmount && Number(rentAmount) > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                2 kira ({(Number(rentAmount) * 2).toLocaleString('tr-TR')} ₺) ev sahibine, 1 kira ({Number(rentAmount).toLocaleString('tr-TR')} ₺) platform işlem ücreti
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 card-muted p-4 flex items-start gap-3">
          <input id="lateFee" type="checkbox" checked={lateFeeEnabled} onChange={e => setLateFeeEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 text-teal-600 border-slate-300 rounded" />
          <div>
            <label htmlFor="lateFee" className="text-sm font-semibold text-slate-700 cursor-pointer">Gecikme faizi uygulansın</label>
            <p className="text-xs text-slate-500 mt-0.5">Ödemeler gecikirse, ilk 5 günden sonra günlük %1 faiz işletilir.</p>
          </div>
        </div>
        <div className="section-divider">
          <h4 className="text-base font-semibold text-slate-900 mb-4">Ödeme Alıcı Bilgileri (IBAN)</h4>
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
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(2)} className="btn btn-ghost">← Geri</button>
        <button onClick={() => setStep(4)} className="btn btn-primary">Devam Et →</button>
      </div>
    </div>
  );

  // ─── Landlord Step 4: Fixtures & Clauses ───
  const renderLandlordStep4 = () => (
    <div className="space-y-6">
      {/* Demirbaş */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-info">Adım 4</span>
          <h3 className="text-lg font-semibold text-slate-900">Demirbaş Listesi</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Kiralanan mülkteki demirbaşları ekleyin (buzdolabı, çamaşır makinesi vb.).</p>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newFixtureName} onChange={e => setNewFixtureName(e.target.value)} placeholder="Demirbaş adı (ör: Buzdolabı)" className="form-input flex-1" />
          <select value={newFixtureCondition} onChange={e => setNewFixtureCondition(e.target.value)} className="form-input w-32">
            <option value="iyi">İyi</option>
            <option value="orta">Orta</option>
            <option value="eski">Eski</option>
            <option value="yeni">Yeni</option>
          </select>
          <button type="button" onClick={() => { if (newFixtureName.trim()) { setFixtures(prev => [...prev, { name: newFixtureName.trim(), condition: newFixtureCondition }]); setNewFixtureName(''); } }} className="btn btn-primary text-xs px-3 shrink-0">Ekle</button>
        </div>
        {fixtures.length > 0 ? (
          <div className="border rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Demirbaş</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-600">Durum</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixtures.map((f, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{f.name}</td>
                    <td className="px-4 py-2"><span className="badge badge-muted text-xs capitalize">{f.condition}</span></td>
                    <td className="px-4 py-2 text-right"><button type="button" onClick={() => setFixtures(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-xs">Sil</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Henüz demirbaş eklenmedi. (opsiyonel)</p>
        )}
      </div>

      {/* Sözleşme Maddeleri */}
      <div className="card p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Sözleşme Maddeleri</h3>
        <p className="text-sm text-slate-500 mb-4">Hazır maddelerden seçin veya kendi maddenizi ekleyin.</p>

        <div className="space-y-2 max-h-72 overflow-y-auto border rounded-xl p-3">
          {DEFAULT_CLAUSES.map((clause, i) => (
            <label key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={selectedClauses.has(i)} onChange={() => { setSelectedClauses(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; }); }} className="mt-0.5 h-4 w-4 text-teal-600 border-slate-300 rounded shrink-0" />
              <span className="text-xs text-slate-700">{i + 1}. {clause}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => { const all = new Set(DEFAULT_CLAUSES.map((_, i) => i)); setSelectedClauses(all); }} className="text-xs text-teal-600 hover:text-teal-700 font-semibold">Tümünü Seç</button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={() => setSelectedClauses(new Set())} className="text-xs text-slate-500 hover:text-slate-700 font-semibold">Tümünü Kaldır</button>
          <span className="text-xs text-slate-400 ml-auto">{selectedClauses.size} madde seçili</span>
        </div>

        {/* Özel Maddeler */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Özel Maddeler</h4>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newCustomClause} onChange={e => setNewCustomClause(e.target.value)} placeholder="Kendi maddenizi yazın..." className="form-input flex-1 text-sm" />
            <button type="button" onClick={() => { if (newCustomClause.trim()) { setCustomClauses(prev => [...prev, newCustomClause.trim()]); setNewCustomClause(''); } }} className="btn btn-primary text-xs px-3 shrink-0">Ekle</button>
          </div>
          {customClauses.length > 0 && (
            <div className="space-y-2">
              {customClauses.map((c, i) => (
                <div key={i} className="flex items-start gap-2 bg-teal-50 rounded-lg p-2">
                  <span className="text-xs text-teal-700 flex-1">{selectedClauses.size + i + 1}. {c}</span>
                  <button type="button" onClick={() => setCustomClauses(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-xs shrink-0">Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(3)} className="btn btn-ghost">← Geri</button>
        <button onClick={() => setStep(5)} className="btn btn-primary">Devam Et →</button>
      </div>
    </div>
  );

  // ─── Landlord Step 5: Review ───
  const renderLandlordStep5 = () => (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-success">Adım 5</span>
          <h3 className="text-lg font-semibold text-slate-900">Önizleme &amp; Onay</h3>
        </div>
        <div className="card-muted rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Sözleşme Özeti</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lütfen tüm bilgileri kontrol edin.</p>
          </div>
          <div className="divide-y divide-slate-200">
            {[
              { label: 'Kiracı', value: `${tenantName} (${tenantEmail})` },
              { label: 'Taşınmaz', value: properties.find(p => p.id === selectedPropertyId)?.address?.fullText || '—' },
              { label: 'Kira Bedeli', value: `${rentAmount} TL` },
              { label: 'Başlangıç', value: startDate },
              { label: 'Ödeme Günü', value: `Her ayın ${payDay}. günü` },
              { label: 'IBAN', value: `${iban} (${receiverName})` },
              { label: 'Gecikme Faizi', value: lateFeeEnabled ? 'Aktif' : 'Pasif' },
              { label: 'Depozito', value: rentAmount ? `${Number(rentAmount) * 3} TL (2 kira ev sahibine, 1 kira platform)` : 'Yok' },
              { label: 'Demirbaş', value: fixtures.length > 0 ? `${fixtures.length} adet` : 'Yok' },
              { label: 'Sözleşme Maddeleri', value: `${selectedClauses.size + customClauses.length} madde` },
            ].map((row) => (
              <div key={row.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr]">
                <dt className="text-sm font-semibold text-slate-500">{row.label}</dt>
                <dd className="text-sm text-slate-900">{row.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setStep(4)} className="btn btn-ghost">← Geri</button>
        <button onClick={handleLandlordSubmit} disabled={loading} className="btn btn-primary">
          {loading ? (<><span className="spinner h-4 w-4" /> Oluşturuluyor...</>) : 'Sözleşmeyi Onayla ve Oluştur'}
        </button>
      </div>
    </div>
  );

  // ─── Tenant Step 1: Landlord Info ───
  const renderTenantStep1 = () => (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="badge badge-info">Adım 1</span>
          <h3 className="text-lg font-semibold text-slate-900">Ev Sahibi Bilgileri</h3>
        </div>
        <div className="card-muted p-4 mb-6">
          <p className="text-sm text-slate-700">Bu modda <strong>%10 komisyon</strong> uygulanır. Erken ödeme indirimi geçerli değildir. Ödemeniz bize ulaştıktan sonra ev sahibinize IBAN üzerinden aktarılır.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="form-group">
            <label className="form-label">Ev Sahibi Ad Soyad</label>
            <input type="text" required value={landlordName} onChange={e => setLandlordName(e.target.value)} className="form-input" placeholder="Ahmet Yılmaz" />
          </div>
          <div className="form-group">
            <label className="form-label">Ev Sahibi IBAN</label>
            <input type="text" required value={landlordIban} onChange={e => setLandlordIban(formatIBAN(e.target.value))} className={`form-input font-mono text-sm tracking-wide ${landlordIban && !isValidIBAN(landlordIban) ? 'border-red-300 focus:ring-red-500' : ''}`} placeholder="TR00 0000 0000 0000 0000 0000 00" />
            {landlordIban && !isValidIBAN(landlordIban) && <p className="text-xs text-red-500 mt-1">IBAN TR ile başlamalı ve 24 rakam içermelidir</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button onClick={() => { setStep(0); setInviteChoice(null); }} className="btn btn-ghost">← Geri</button>
        <button onClick={() => setStep(2)} disabled={!landlordName.trim() || !isValidIBAN(landlordIban)} className="btn btn-primary">Devam Et →</button>
      </div>
    </div>
  );

  // ─── Tenant Step 2: Rent Info ───
  const renderTenantStep2 = () => {
    const rent = Number(tenantRentAmount) || 0;
    const commission = Math.round(rent * 0.10);
    const total = rent + commission;
    return (
      <div className="space-y-6">
        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="badge badge-info">Adım 2</span>
            <h3 className="text-lg font-semibold text-slate-900">Kira Bilgileri</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Aylık Kira Bedeli</label>
              <div className="relative">
                <input type="number" required min={1} value={tenantRentAmount} onChange={e => setTenantRentAmount(e.target.value)} className="form-input pr-12" placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">TL</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ödeme Günü (Ayın kaçı?)</label>
              <select value={tenantPayDay} onChange={e => setTenantPayDay(e.target.value)} className="form-input">
                {Array.from({length: 30}, (_, i) => i + 1).map(d => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div className="form-group sm:col-span-2">
              <label className="form-label">Başlangıç Tarihi</label>
              <input type="date" value={tenantStartDate} onChange={e => setTenantStartDate(e.target.value)} className="form-input" />
            </div>
          </div>
          {rent > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Kira Tutarı</span><span className="font-semibold text-slate-900">{rent.toLocaleString()} ₺</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Komisyon (%10)</span><span className="font-semibold text-slate-900">{commission.toLocaleString()} ₺</span></div>
              <div className="border-t border-slate-200 pt-2 flex justify-between"><span className="text-slate-900 font-bold">Aylık Toplam Ödeme</span><span className="text-lg font-bold text-teal-700">{total.toLocaleString()} ₺</span></div>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <button onClick={() => setStep(1)} className="btn btn-ghost">← Geri</button>
          <button onClick={() => setStep(3)} disabled={rent <= 0} className="btn btn-primary">Devam Et →</button>
        </div>
      </div>
    );
  };

  // ─── Tenant Step 3: Review ───
  const renderTenantStep3 = () => {
    const rent = Number(tenantRentAmount) || 0;
    const commission = Math.round(rent * 0.10);
    const total = rent + commission;
    return (
      <div className="space-y-6">
        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="badge badge-success">Adım 3</span>
            <h3 className="text-lg font-semibold text-slate-900">Önizleme &amp; Onay</h3>
          </div>
          <div className="card-muted rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Sözleşme Özeti</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {[
                { label: 'Ev Sahibi', value: landlordName },
                { label: 'IBAN', value: landlordIban },
                { label: 'Kira Bedeli', value: `${rent.toLocaleString()} ₺` },
                { label: 'Komisyon (%10)', value: `${commission.toLocaleString()} ₺` },
                { label: 'Aylık Toplam', value: `${total.toLocaleString()} ₺` },
                { label: 'Ödeme Günü', value: `Her ayın ${tenantPayDay}. günü` },
                { label: 'Başlangıç', value: tenantStartDate || 'Bugün' },
              ].map((row) => (
                <div key={row.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr]">
                  <dt className="text-sm font-semibold text-slate-500">{row.label}</dt>
                  <dd className="text-sm text-slate-900">{row.value}</dd>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <button onClick={() => setStep(2)} className="btn btn-ghost">← Geri</button>
          <button onClick={handleTenantSubmit} disabled={loading} className="btn btn-primary">
            {loading ? (<><span className="spinner h-4 w-4" /> Oluşturuluyor...</>) : 'Sözleşmeyi Onayla ve Oluştur'}
          </button>
        </div>
      </div>
    );
  };

  // ─── Main Render ───
  const renderCurrentStep = () => {
    if (step === 0) return renderRoleSelection();
    if (roleChoice === 'landlord') {
      if (step === 1) return renderLandlordStep1();
      if (step === 2) return renderLandlordStep2();
      if (step === 3) return renderLandlordStep3();
      if (step === 4) return renderLandlordStep4();
      if (step === 5) return renderLandlordStep5();
    }
    if (roleChoice === 'tenant') {
      if (step === 1) return renderTenantStep1();
      if (step === 2) return renderTenantStep2();
      if (step === 3) return renderTenantStep3();
    }
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title">Yeni Sözleşme Oluştur</h2>
        <p className="page-subtitle">Adım adım sözleşme bilgilerini girin.</p>
      </div>
      {renderStepIndicator()}
      {renderCurrentStep()}
    </div>
  );
};

export default NewContract;
