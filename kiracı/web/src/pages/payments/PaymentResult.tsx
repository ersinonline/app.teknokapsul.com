import { useSearchParams, Link } from 'react-router-dom';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'unknown';

  const config: Record<string, { icon: string; title: string; text: string; color: string }> = {
    success: {
      icon: '✓',
      title: 'Ödeme Başarılı!',
      text: 'Ödemeniz başarıyla alındı. Fatura durumunuz kısa sürede güncellenecektir.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    failed: {
      icon: '✕',
      title: 'Ödeme Başarısız',
      text: 'Ödemeniz gerçekleştirilemedi. Lütfen tekrar deneyin veya farklı bir kart kullanın.',
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    pending: {
      icon: '⏳',
      title: 'Ödeme Beklemede',
      text: 'Ödemeniz işleniyor. Durum kısa sürede güncellenecektir.',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    error: {
      icon: '!',
      title: 'Bir Hata Oluştu',
      text: 'Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      color: 'text-red-600 bg-red-50 border-red-200',
    },
  };

  const c = config[status] || config.error;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className={`mx-auto w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl font-bold ${c.color}`}>
          {c.icon}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/invoices" className="btn btn-primary">
            Faturalarıma Dön
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
