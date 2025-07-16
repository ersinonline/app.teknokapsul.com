import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../../components/auth/LoginForm';
import { SocialLogin } from '../../components/auth/SocialLogin';
import { Package, Mail, Smartphone } from 'lucide-react';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
  const [selectedMethod, setSelectedMethod] = useState<'google' | 'apple' | 'sms' | 'email' | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-yellow-800 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="container mx-auto px-4 py-8 lg:py-0 flex flex-col lg:flex-row min-h-screen">
        {/* Left Section - Hero/Branding - Hidden on mobile */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center py-8 lg:py-16">
          <div className="max-w-xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">TeknoKapsül</h1>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Tüm Dijital İhtiyaçlarınız Tek Yerde
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Aboneliklerinizi, ödemelerinizi ve dijital hesaplarınızı kolayca yönetin.
                Tek platform, sınırsız kontrol.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm transition-all hover:bg-white/70">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✓</span>
                </div>
                <span className="font-medium">Güvenli Veri Saklama</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm transition-all hover:bg-white/70">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600">✓</span>
                </div>
                <span className="font-medium">7/24 Destek</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm transition-all hover:bg-white/70">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600">✓</span>
                </div>
                <span className="font-medium">Kolay Kullanım</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl backdrop-blur-sm transition-all hover:bg-white/70">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600">✓</span>
                </div>
                <span className="font-medium">Akıllı Hatırlatmalar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-8 lg:py-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="text-center mb-6 sm:mb-8">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">TK</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? 'Hesap Oluşturun' : 'Hoş Geldiniz'}
                </h2>
                <p className="text-gray-600 mb-8">
                  {isSignUp ? 'TeknoKapsül hesabınızı oluşturun' : 'TeknoKapsül hesabınıza giriş yapın'}
                </p>
              </div>

              <div className="space-y-6">
                {!selectedMethod ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
                      {isSignUp ? 'Kayıt yönteminizi seçin' : 'Giriş yönteminizi seçin'}
                    </h3>
                    
                    <div className="space-y-3">
                      <SocialLogin method="google" />
                      <SocialLogin method="apple" />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedMethod('sms')}
                          className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                        >
                          <Smartphone className="h-8 w-8 mb-2 text-gray-700 group-hover:text-green-600" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">SMS</span>
                        </button>
                        
                        <button
                          onClick={() => setSelectedMethod('email')}
                          className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 group"
                        >
                          <Mail className="h-8 w-8 mb-2 text-gray-700 group-hover:text-yellow-600" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-600">E-posta</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedMethod === 'google' && (isSignUp ? 'Google ile Kayıt' : 'Google ile Giriş')}
                        {selectedMethod === 'apple' && (isSignUp ? 'Apple ile Kayıt' : 'Apple ile Giriş')}
                        {selectedMethod === 'sms' && (isSignUp ? 'SMS ile Kayıt' : 'SMS ile Giriş')}
                        {selectedMethod === 'email' && (isSignUp ? 'E-posta ile Kayıt' : 'E-posta ile Giriş')}
                      </h3>
                      <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Geri
                      </button>
                    </div>
                    
                    {selectedMethod === 'google' && (
                       <SocialLogin method="google" />
                     )}
                     
                     {selectedMethod === 'apple' && (
                       <SocialLogin method="apple" />
                     )}
                     
                     {selectedMethod === 'sms' && (
                       <SocialLogin method="sms" />
                     )}
                    
                    {selectedMethod === 'email' && (
                      <LoginForm isSignUp={isSignUp} />
                    )}
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {isSignUp ? 'Zaten hesabınız var mı?' : 'Henüz hesabınız yok mu?'}{' '}
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="font-semibold text-yellow-600 hover:text-yellow-500 transition-colors underline"
                    >
                      {isSignUp ? 'Giriş yapın' : 'Hemen kayıt olun'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};