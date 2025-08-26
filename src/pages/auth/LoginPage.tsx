import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SignIn } from '@clerk/clerk-react';
import { Package } from 'lucide-react';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Mobilde dashboard'a, masaüstünde anasayfaya yönlendir
  const getDefaultRedirect = () => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    return isMobile ? '/dashboard' : '/';
  };
  
  const from = location.state?.from || getDefaultRedirect();

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
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600">✓</span>
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

        {/* Right Section - Clerk SignIn */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-8 lg:py-16">
          <div className="w-full max-w-md">
            <SignIn 
              redirectUrl={from}
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-white rounded-2xl shadow-xl",
                  headerTitle: "text-3xl font-bold text-gray-900",
                  headerSubtitle: "text-gray-600",
                  socialButtonsBlockButton: "border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50",
                  formButtonPrimary: "bg-yellow-600 hover:bg-yellow-700",
                  footerActionLink: "text-yellow-600 hover:text-yellow-500"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};