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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex flex-col lg:flex-row">
      {/* Left Section - Hero/Branding */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-12 h-12 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">TeknoKapsül</h1>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Tüm Dijital İhtiyaçlarınız Tek Yerde
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Aboneliklerinizi, ödemelerinizi ve dijital hesaplarınızı kolayca yönetin.
            Tek platform, sınırsız kontrol.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-4 bg-white/50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <span>Güvenli Veri Saklama</span>
            </div>
            <div className="flex items-center gap-2 p-4 bg-white/50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">✓</span>
              </div>
              <span>7/24 Destek</span>
            </div>
            <div className="flex items-center gap-2 p-4 bg-white/50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">✓</span>
              </div>
              <span>Kolay Kullanım</span>
            </div>
            <div className="flex items-center gap-2 p-4 bg-white/50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">✓</span>
              </div>
              <span>Akıllı Hatırlatmalar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
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
              className="text-sm text-yellow-600 hover:text-yellow-700"
            >
              {isSignUp
                ? 'Zaten hesabınız var mı? Giriş yapın'
                : 'Hesabınız yok mu? Kaydolun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};