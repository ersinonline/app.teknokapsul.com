import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Zap, Users, Star, Loader2, Mail, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type AuthMode = 'login' | 'register' | 'forgot';

export const LoginPage = () => {
  const { user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const from = location.state?.from || '/';

  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, from, navigate]);

  // Mode değiştiğinde hataları temizle
  useEffect(() => {
    setLocalError(null);
    setSuccessMsg(null);
  }, [mode]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#ffb700] rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setLocalError('E-posta adresi gerekli.');
      return;
    }

    if (mode === 'forgot') {
      setSigningIn(true);
      try {
        await resetPassword(email);
        setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      } catch {
        // error is set by context
      } finally {
        setSigningIn(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Şifre gerekli.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setLocalError('Ad Soyad gerekli.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Şifre en az 6 karakter olmalıdır.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Şifreler eşleşmiyor.');
        return;
      }
    }

    setSigningIn(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch {
      // error is set by context
    } finally {
      setSigningIn(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Section - Hero/Branding - Desktop Only */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#ffb700] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#ffb700] rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-[#ffb700] rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 max-w-xl mx-auto px-12 space-y-12">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="w-14 h-14 bg-[#ffb700] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">T</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">TeknoKapsül</h1>
              </div>
            </div>

            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Dijital<br />
                <span className="text-[#ffb700] relative">
                  Yaşamınız
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#ffb700] opacity-30 rounded-full"></div>
                </span><br />
                Tek Yerde
              </h2>
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Aboneliklerinizi, ödemelerinizi ve dijital hesaplarınızı 
                <span className="text-[#ffb700] font-semibold"> akıllıca yönetin</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
                <Shield className="w-6 h-6 text-[#ffb700]" />
                <span className="text-gray-700 font-medium">Güvenli</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
                <Zap className="w-6 h-6 text-[#ffb700]" />
                <span className="text-gray-700 font-medium">Hızlı</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-[#ffb700]" />
                <span className="text-gray-700 font-medium">Kolay</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
                <Star className="w-6 h-6 text-[#ffb700]" />
                <span className="text-gray-700 font-medium">Akıllı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="lg:hidden text-center mb-8 sm:mb-10">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ffb700] rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">T</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">TeknoKapsül</h1>
              </div>
              <p className="text-gray-600 text-base sm:text-lg">
                Dijital yaşamınızı kolaylaştıran platform
              </p>
            </div>
            
            {/* Auth Card */}
            <div className="w-full max-w-sm mx-auto">
              <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl p-6 sm:p-8 border border-gray-100">
                {/* Header */}
                <div className="text-center mb-5">
                  {mode !== 'login' && (
                    <button onClick={() => setMode('login')} className="absolute left-6 top-6 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <ArrowLeft className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {mode === 'login' ? 'Hoş Geldiniz' : mode === 'register' ? 'Hesap Oluştur' : 'Şifre Sıfırla'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {mode === 'login' ? 'Hesabınıza giriş yapın' : mode === 'register' ? 'Yeni hesap oluşturun' : 'E-posta adresinizi girin'}
                  </p>
                </div>

                {/* Error */}
                {displayError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {displayError}
                  </div>
                )}

                {/* Success */}
                {successMsg && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}

                {/* Google Sign-In (only on login/register) */}
                {mode !== 'forgot' && (
                  <>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={signingIn}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#ffb700]/50 hover:bg-[#ffb700]/5 text-gray-700 font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signingIn && mode === 'login' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#ffb700]" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      <span>Google ile {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-gray-400 font-medium">veya e-posta ile</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {/* Display Name (register only) */}
                  {mode === 'register' && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-posta adresi"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Password (not on forgot) */}
                  {mode !== 'forgot' && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Şifre"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* Confirm Password (register only) */}
                  {mode === 'register' && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Şifre tekrar"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Forgot password link (login only) */}
                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-[#ffb700] hover:text-[#e6a500] font-medium transition-colors"
                      >
                        Şifremi Unuttum
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full py-2.5 bg-gradient-to-r from-[#ffb700] to-[#ffa000] hover:from-[#e6a500] hover:to-[#ff8f00] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Sıfırlama Bağlantısı Gönder'}
                  </button>
                </form>

                {/* Toggle login/register */}
                <div className="mt-5 text-center text-sm">
                  {mode === 'login' ? (
                    <p className="text-gray-500">
                      Hesabınız yok mu?{' '}
                      <button onClick={() => setMode('register')} className="text-[#ffb700] hover:text-[#e6a500] font-semibold transition-colors">
                        Kayıt Ol
                      </button>
                    </p>
                  ) : mode === 'register' ? (
                    <p className="text-gray-500">
                      Zaten hesabınız var mı?{' '}
                      <button onClick={() => setMode('login')} className="text-[#ffb700] hover:text-[#e6a500] font-semibold transition-colors">
                        Giriş Yap
                      </button>
                    </p>
                  ) : (
                    <button onClick={() => setMode('login')} className="text-[#ffb700] hover:text-[#e6a500] font-semibold transition-colors">
                      Giriş sayfasına dön
                    </button>
                  )}
                </div>

                {mode !== 'forgot' && (
                  <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400">
                      Giriş yaparak <span className="text-[#ffb700] font-medium">Kullanım Koşulları</span> ve{' '}
                      <span className="text-[#ffb700] font-medium">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} TeknoKapsül. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};