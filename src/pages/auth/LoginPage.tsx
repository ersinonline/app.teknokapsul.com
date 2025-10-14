import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Shield, Zap, Users, Star, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export const LoginPage = () => {
  const { user, loading } = useAuth();
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Her zaman ana sayfaya yönlendir
  const getDefaultRedirect = () => {
    return '/';
  };
  
  const from = location.state?.from || getDefaultRedirect();

  // Kullanıcı giriş yaptığında otomatik yönlendirme - React Router kullanarak
  useEffect(() => {
    if ((user && !loading) || (isSignedIn && isLoaded)) {
      setIsRedirecting(true);
      // React Router navigate kullanarak sayfa yenilenmeden yönlendir
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, isSignedIn, isLoaded, from, navigate]);

  if (loading || !isLoaded) {
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

  // Yönlendirme durumu
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-[#ffb700] rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="mt-4 text-gray-900 font-medium">Giriş başarılı! Yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  // Çifte kontrol: hem AuthContext hem de Clerk'in kendi durumu
  if (user || isSignedIn) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Section - Hero/Branding - Desktop Only */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex-col justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#ffb700] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#ffb700] rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-[#ffb700] rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 max-w-xl mx-auto px-12 space-y-12">
            {/* Logo and Brand */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="w-14 h-14 bg-[#ffb700] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">T</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">
                  TeknoKapsül
                </h1>
              </div>
            </div>

            {/* Main Heading */}
            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Dijital
                <br />
                <span className="text-[#ffb700] relative">
                  Yaşamınız
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#ffb700] opacity-30 rounded-full"></div>
                </span>
                <br />
                Tek Yerde
              </h2>
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Aboneliklerinizi, ödemelerinizi ve dijital hesaplarınızı 
                <span className="text-[#ffb700] font-semibold"> akıllıca yönetin</span>
              </p>
            </div>

            {/* Features Grid */}
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

        {/* Right Section - Clerk SignIn */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="lg:hidden text-center mb-8 sm:mb-12">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ffb700] rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">T</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  TeknoKapsül
                </h1>
              </div>
              <p className="text-gray-600 text-base sm:text-lg">
                Dijital yaşamınızı kolaylaştıran platform
              </p>
            </div>
            
            {/* Compact Clerk SignIn Form */}
            <div className="w-full max-w-sm mx-auto">
              <SignIn 
                redirectUrl="/"
                fallbackRedirectUrl="/"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-xl p-5 w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    
                    // Social buttons - Compact
                    socialButtonsBlockButton: "bg-white/80 backdrop-blur-sm border border-white/20 hover:border-[#ffb700]/50 hover:bg-[#ffb700]/5 text-gray-700 w-full py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md",
                    socialButtonsBlockButtonText: "font-medium text-gray-700",
                    socialButtonsBlockButtonArrow: "hidden",
                    
                    // Form inputs - Compact
                    formFieldInput: "bg-white/70 backdrop-blur-sm border border-gray-200/50 focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 text-gray-900 placeholder-gray-500 w-full py-2.5 px-3 text-sm transition-all duration-200 rounded-lg font-medium shadow-inner",
                    formFieldLabel: "text-sm font-semibold text-gray-800 mb-1.5 block",
                    
                    // Primary button - Compact
                    formButtonPrimary: "bg-gradient-to-r from-[#ffb700] to-[#ffa000] hover:from-[#e6a500] hover:to-[#ff8f00] text-white font-semibold w-full py-2.5 px-4 text-sm transition-all duration-200 rounded-lg shadow-md hover:shadow-lg",
                    
                    // Links and actions - Compact
                    footerActionLink: "text-[#ffb700] hover:text-[#e6a500] text-sm font-semibold transition-all duration-200",
                    formFieldAction: "text-[#ffb700] hover:text-[#e6a500] text-xs font-medium transition-all duration-200",
                    
                    // Divider - Compact
                    dividerLine: "bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px",
                    dividerText: "text-gray-600 text-xs font-medium bg-white px-3 relative",
                    dividerRow: "my-4 relative",
                    
                    // Error and success states
                    formFieldSuccessText: "text-green-600 text-xs font-medium mt-1",
                    formFieldErrorText: "text-red-600 text-xs font-medium mt-1",
                    alertText: "text-red-600 text-xs font-medium",
                    formFieldHintText: "text-gray-600 text-xs mt-1",
                    
                    // Password toggle
                    formFieldInputShowPasswordButton: "text-gray-500 hover:text-[#ffb700] transition-all duration-200",
                    
                    // OTP inputs - Compact
                    otpCodeFieldInput: "bg-white/80 backdrop-blur-sm border border-gray-200/50 focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/20 text-gray-900 text-center text-base font-semibold rounded-lg w-10 h-10 mx-1 shadow-sm transition-all duration-200",
                    
                    // Resend code
                    formResendCodeLink: "text-[#ffb700] hover:text-[#e6a500] text-xs font-medium transition-all duration-200",
                    
                    // Identity preview
                    identityPreviewText: "text-sm text-gray-900 font-medium",
                    identityPreviewEditButton: "text-[#ffb700] hover:text-[#e6a500] text-xs font-medium ml-2 transition-all duration-200",
                    
                    // Form container - Compact
                    form: "space-y-3",
                    formFieldRow: "space-y-1",
                    
                    // Footer - Compact
                    footer: "mt-5 pt-4 border-t border-gray-200/50",
                    footerAction: "text-center",
                    footerActionText: "text-gray-600 text-xs font-medium",
                    
                    // Loading states
                    spinner: "border-[#ffb700] border-t-transparent",
                    
                    // Alternative methods
                    alternativeMethodsBlockButton: "bg-white/60 hover:bg-white/80 border border-gray-200/50 text-gray-700 font-medium py-2 px-3 rounded-lg transition-all duration-200",
                    
                    // Main container - Compact spacing
                    main: "space-y-3"
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    showOptionalFields: false
                  }
                }}
              />
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