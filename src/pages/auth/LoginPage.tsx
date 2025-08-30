import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Package } from 'lucide-react';
import { useEffect } from 'react';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const { isSignedIn, isLoaded } = useUser(); // Clerk'in kendi hook'u
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mobilde dashboard'a, masaüstünde anasayfaya yönlendir
  const getDefaultRedirect = () => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    return isMobile ? '/dashboard' : '/';
  };
  
  const from = location.state?.from || getDefaultRedirect();

  // Kullanıcı giriş yaptığında otomatik yönlendirme
  useEffect(() => {
    if ((user && !loading) || (isSignedIn && isLoaded)) {
      // Kısa bir gecikme ile yönlendirme yap
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, isSignedIn, isLoaded, from, navigate]);

  if (loading || !isLoaded) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-yellow-800 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Çifte kontrol: hem AuthContext hem de Clerk'in kendi durumu
  if (user || isSignedIn) {
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
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto",
                  headerTitle: "text-2xl md:text-3xl font-bold text-gray-900",
                  headerSubtitle: "text-gray-600 text-sm md:text-base",
                  socialButtonsBlockButton: "border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 w-full py-3 text-sm md:text-base",
                  formButtonPrimary: "bg-yellow-600 hover:bg-yellow-700 w-full py-3 text-sm md:text-base",
                  footerActionLink: "text-yellow-600 hover:text-yellow-500 text-sm md:text-base",
                  formFieldInput: "w-full py-3 px-4 text-sm md:text-base",
                  formFieldLabel: "text-sm md:text-base font-medium text-gray-700",
                  identityPreviewText: "text-sm md:text-base",
                  identityPreviewEditButton: "text-sm md:text-base"
                },
                layout: {
                  socialButtonsPlacement: "top",
                  showOptionalFields: false
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};