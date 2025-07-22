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
  verifyToken: () => Promise<any>;
  checkSession: () => Promise<any>;
  refreshToken: () => Promise<boolean>;
  isWebView: boolean;
}