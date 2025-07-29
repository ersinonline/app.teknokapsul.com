import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loginTrackingService } from './login-tracking.service';

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await loginTrackingService.recordLogin('email', true);
    return result;
  } catch (error) {
    await loginTrackingService.recordFailedLogin(email, 'email');
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && result.user) {
      await updateProfile(result.user, {
        displayName,
      });
    }
    
    await loginTrackingService.recordLogin('email', true);
    return result;
  } catch (error) {
    await loginTrackingService.recordFailedLogin(email, 'email');
    throw error;
  }
};

export const sendMagicLink = async (email: string) => {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/verify',
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Store email in localStorage for verification
    localStorage.setItem('emailForSignIn', email);
    return true;
  } catch (error) {
    console.error('Magic link gönderme hatası:', error);
    throw error;
  }
};

export const verifyMagicLink = async (email?: string) => {
  try {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = email;
      
      if (!emailForSignIn) {
        emailForSignIn = localStorage.getItem('emailForSignIn') || undefined;
      }
      
      if (!emailForSignIn) {
        throw new Error('Email not found');
      }
      
      const result = await signInWithEmailLink(auth, emailForSignIn, window.location.href);
      localStorage.removeItem('emailForSignIn');
      await loginTrackingService.recordLogin('email', true);
      return result;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const checkMagicLink = () => {
  return isSignInWithEmailLink(auth, window.location.href);
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const result = await signInWithPopup(auth, provider);
    await loginTrackingService.recordLogin('google', true);
    return result;
  } catch (error) {
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const result = await signInWithPopup(auth, provider);
    await loginTrackingService.recordLogin('apple', true);
    return result;
  } catch (error) {
    throw error;
  }
};

export const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    throw error;
  }
};

export const verifyPhoneCode = async (confirmationResult: any, verificationCode: string) => {
  try {
    const result = await confirmationResult.confirm(verificationCode);
    await loginTrackingService.recordLogin('phone', true);
    return result;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await loginTrackingService.recordLogout();
    return firebaseSignOut(auth);
  } catch (error) {
    console.error('Error during logout:', error);
    return firebaseSignOut(auth);
  }
};

export const updateUserProfile = async (displayName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  return updateProfile(user, {
    displayName,
  });
};

export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('No user logged in');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updatePassword(user, newPassword);
};
