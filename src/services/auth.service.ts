import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
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

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await loginTrackingService.recordLogin('google', true);
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
