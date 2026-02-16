import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const DigitalPaymentResultPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const status = searchParams.get('status');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!user) return;

    const verifyPayment = async () => {
      if (status === 'success' && token) {
        try {
          const functions = getFunctions();
          const verify = httpsCallable(functions, 'iyzicoCheckoutVerify');
          const result = await verify({ token });
          const data = result.data as any;

          if (data.status === 'success') {
            setSuccess(true);
            setPaymentId(data.paymentId);
          } else {
            setSuccess(false);
            setError(data.errorMessage || 'Ödeme doğrulanamadı.');
          }
        } catch (err: any) {
          console.error('Ödeme doğrulama hatası:', err);
          setSuccess(false);
          setError('Ödeme doğrulanırken bir hata oluştu.');
        }
      } else if (status === 'fail') {
        setSuccess(false);
        setError('Ödeme başarısız oldu.');
      } else {
        setSuccess(false);
        setError('Geçersiz ödeme durumu.');
      }
      setLoading(false);
    };

    verifyPayment();
  }, [user, status, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Ödeme doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {success ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Ödeme Başarılı!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Dijital kodunuz siparişlerinize eklendi.
            </p>
            {paymentId && (
              <p className="text-xs text-muted-foreground mb-6">Ödeme ID: {paymentId}</p>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Ödeme Başarısız</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'Ödeme işlemi tamamlanamadı.'}
            </p>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dijital-kodlar')}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dijital Kodlara Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPaymentResultPage;
