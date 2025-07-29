import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, sendMagicLink } from '../../services/auth.service';

interface LoginFormProps {
  isSignUp?: boolean;
}

export const LoginForm = ({ isSignUp = false }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (useMagicLink && !isSignUp) {
        // Send magic link
        try {
          console.log('Sihirli link gönderiliyor:', email);
          await sendMagicLink(email);
          console.log('Sihirli link başarıyla gönderildi');
          setMagicLinkSent(true);
          setError('');
        } catch (error: any) {
          console.error('Sihirli link gönderme hatası:', error);
          setError(error.message || 'Sihirli link gönderilirken bir hata oluştu. Lütfen e-posta adresinizi kontrol edin.');
        }
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Validation for sign up
        if (password !== confirmPassword) {
          setError('Şifreler eşleşmiyor.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Şifre en az 6 karakter olmalıdır.');
          setLoading(false);
          return;
        }
        
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (useMagicLink && !isSignUp) {
        if (err.code === 'auth/invalid-email') {
          setError('Geçersiz e-posta adresi.');
        } else {
          setError('Sihirli link gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } else if (isSignUp) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Bu e-posta adresi zaten kullanımda.');
        } else if (err.code === 'auth/weak-password') {
          setError('Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Geçersiz e-posta adresi.');
        } else {
          setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } else {
        if (err.code === 'auth/user-not-found') {
          setError('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
        } else if (err.code === 'auth/wrong-password') {
          setError('Hatalı şifre.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Geçersiz e-posta adresi.');
        } else {
          setError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          <p className="font-medium">Sihirli link gönderildi!</p>
          <p className="text-sm mt-1">
            {email} adresine giriş linki gönderdik. E-postanızı kontrol edin ve linke tıklayarak giriş yapın.
          </p>
        </div>
        <button
          onClick={() => {
            setMagicLinkSent(false);
            setError('');
          }}
          className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
        >
          Tekrar gönder
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!isSignUp && (
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useMagicLink}
              onChange={(e) => setUseMagicLink(e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Sihirli link ile giriş (şifresiz)
            </span>
          </label>
        </div>
      )}

      {isSignUp && (
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            Ad Soyad (İsteğe bağlı)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            disabled={loading}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
          disabled={loading}
        />
      </div>

      {(!useMagicLink || isSignUp) && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            disabled={loading}
          />
        </div>
      )}

      {isSignUp && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Şifre Tekrarı
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            disabled={loading}
          />
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? (
            useMagicLink && !isSignUp ? 'Link gönderiliyor...' : 
            isSignUp ? 'Kayıt olunuyor...' : 'Giriş yapılıyor...'
          ) : (
            useMagicLink && !isSignUp ? 'Sihirli Link Gönder' :
            isSignUp ? 'Kayıt Ol' : 'Giriş Yap'
          )}
        </button>
      </div>

      {!isSignUp && !useMagicLink && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setUseMagicLink(true)}
            className="text-sm text-yellow-600 hover:text-yellow-500 font-medium"
          >
            Sihirli link ile giriş yap
          </button>
        </div>
      )}
     </form>
   );
 };