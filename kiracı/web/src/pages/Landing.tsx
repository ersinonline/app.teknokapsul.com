import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Rol Bazlı Yetkilendirme',
    desc: 'Ev sahibi, kiracı ve emlakçı rolleri ile herkes sadece kendi yetkili olduğu alanlara erişir.',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    title: 'Hızlı Sözleşme Oluşturma',
    desc: "Adım adım sihirbaz ile dakikalar içinde sözleşme oluşturun ve e-Devlet'e aktarın.",
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Ödeme Takibi',
    desc: 'iyzico entegrasyonu ile güvenli ödeme, otomatik fatura oluşturma ve gecikme faizi hesaplama.',
    icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'e-Devlet Entegrasyonu',
    desc: "Sözleşme maddelerini kopyala-yapıştır ile e-Devlet'e aktarın, onay sürecini takip edin.",
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Hukuki Süreç Takibi',
    desc: 'Geciken ödemeler için otomatik ihtar, icra takibi ve tahliye süreci yönetimi.',
    icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    color: 'bg-red-50 text-red-500',
  },
  {
    title: 'Mobil Uyumlu',
    desc: 'Telefonunuzdan veya bilgisayarınızdan tüm kira işlemlerinizi kolayca yönetin.',
    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    color: 'bg-violet-50 text-violet-600',
  },
];

const stats = [
  { value: '100%', label: 'Dijital Süreç' },
  { value: '7/24', label: 'Erişim' },
  { value: '0₺', label: 'Başlangıç Ücreti' },
  { value: '<5dk', label: 'Sözleşme Oluşturma' },
];

const steps = [
  { num: '1', title: 'Sözleşme Oluştur', desc: 'Şablon + özel madde + demirbaş kaydı.' },
  { num: '2', title: 'e-Devlet Aktar', desc: 'Kopyala-yapıştır, checklist ile ilerle.' },
  { num: '3', title: 'Tahsilat Başlat', desc: 'Onay sonrası iyzico ile ödeme al.' },
  { num: '4', title: 'Aktarım Planla', desc: '8 gün + iş günü kuralıyla aktarım.' },
];

const Landing: React.FC = () => {
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm mb-6 sm:mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Kira sürecinizi uçtan uca yönetin
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 max-w-3xl leading-tight">
            Kira Yönetiminin
            <span className="text-teal-600"> Yeni Nesil</span> Platformu
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-600 max-w-2xl px-4">
            Sözleşme oluşturma, e-Devlet aktarımı, otomatik tahsilat, gecikme faizi ve hukuki süreç takibi — hepsi tek panelde.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link to="/register" className="btn btn-primary px-8 py-3 text-base w-full sm:w-auto">
              Ücretsiz Başla
            </Link>
            <Link to="/login" className="btn btn-secondary px-8 py-3 text-base w-full sm:w-auto">
              Giriş Yap
            </Link>
          </div>
          <div className="mt-14 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full max-w-2xl px-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-teal-700">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Neden eKira?</h2>
          <p className="mt-3 sm:mt-4 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Ev sahipleri, kiracılar ve emlakçılar için tasarlanmış kapsamlı kira yönetim platformu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="card p-6 group">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Nasıl Çalışır?</h3>
            <span className="badge badge-info">4 Adım</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((item) => (
              <div key={item.num} className="flex gap-4 sm:flex-col sm:text-center sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white text-sm font-bold">
                  {item.num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="card-glow p-8 sm:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Hemen Başlayın</h2>
          <p className="mt-3 sm:mt-4 text-slate-600 max-w-lg mx-auto text-sm sm:text-base">
            Ücretsiz hesap oluşturun ve kira sürecinizi dijitalleştirin.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/register" className="btn btn-primary px-8 py-3 text-base w-full sm:w-auto">
              Kayıt Ol
            </Link>
            <Link to="/login" className="btn btn-secondary px-8 py-3 text-base w-full sm:w-auto">
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
