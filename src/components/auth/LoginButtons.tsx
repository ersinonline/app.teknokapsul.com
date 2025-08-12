// import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const LoginButtons = () => {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
      >
        <img
          src="https://i.hizliresim.com/441v5ow.jpg"
          alt="Google"
          className="w-8 h-8 rounded-full"
        />
      </button>
      {/* Add other login buttons similarly */}
    </div>
  );
};