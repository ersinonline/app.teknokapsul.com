import { UserResource } from '@clerk/types';

export interface AuthState {
  user: UserResource | null;
  loading: boolean;
  error: string | null;
  tokenValid: boolean;
  sessionChecked: boolean;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  verifyToken: () => Promise<{ success: boolean; tokenValid: boolean; error: string | null }>;
  checkSession: () => Promise<{ success: boolean; sessionValid: boolean; error: string | null }>;
  refreshToken: () => Promise<{ success: boolean; tokenValid: boolean; error: string | null }>;
  isWebView: boolean;
}