import { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  tokenValid: boolean;
  sessionChecked: boolean;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isWebView: boolean;
  isMobile: boolean;
}