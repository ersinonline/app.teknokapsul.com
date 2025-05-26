import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../../components/auth/LoginForm';
import { SocialLogin } from '../../components/auth/SocialLogin';
import { Logo } from '../../components/common/Logo';
import { Package } from 'lucide-react';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
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
        {/* Left Section - Hero/Branding */}
        <div className="lg:w-1/2 flex flex-col justify-center py-8 lg:py-16">
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
        <div className="lg:w-1/2 flex items-center justify-center py-8 lg:py-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSignUp ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
                </h2>
                <p className="text-gray-600 mt-2">
                  {isSignUp
                    ? 'Hemen ücretsiz hesabınızı oluşturun'
                    : 'Hesabınıza giriş yapın'}
                </p>
              </div>

              <LoginForm />

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">veya</span>
                  </div>
                </div>

                <div className="mt-6">
                  <SocialLogin />
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  {isSignUp
                    ? 'Zaten hesabınız var mı? Giriş yapın'
                    : 'Hesabınız yok mu? Kaydolun'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};