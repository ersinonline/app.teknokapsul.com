import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const SocialLogin = () => {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        className="col-span-3 flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <img
          className="h-5 w-5 mr-2"
          src="https://cdn-icons-png.flaticon.com/128/300/300221.png"
          alt="Google"
        />
        <span>Google ile Giriş Yap</span>
      </button>
    </div>
  );
};