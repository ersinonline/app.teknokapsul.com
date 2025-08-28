import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Clerk ve Firebase arasında köprü görevi gören servis
 * 
 * Bu servis Clerk kullanıcılarını Firebase Authentication ile senkronize eder
 * ve Clerk session token'larından Firebase custom token'ları oluşturur.
 */
class ClerkFirebaseBridgeService {
  private clerk: typeof clerkClient;
  private firebaseApp: any;
  private firebaseAuth: any;

  constructor() {
    // Clerk SDK'yı başlat
    this.clerk = clerkClient;

    // Firebase Admin SDK'yı başlat
    this.initializeFirebase();
  }

  /**
   * Firebase Admin SDK'yı başlatır
   */
  private initializeFirebase() {
    try {
      // Zaten başlatılmış bir app var mı kontrol et
      if (getApps().length === 0) {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount as any),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } else {
        this.firebaseApp = getApps()[0];
      }

      this.firebaseAuth = getAuth(this.firebaseApp);
    } catch (error) {
      console.error('Firebase Admin SDK initialization error:', error);
      throw new Error('Firebase Admin SDK could not be initialized');
    }
  }

  /**
   * Clerk session token'ını doğrular
   */
  async verifyClerkSession(sessionToken: string) {
    try {
      const session = await this.clerk.sessions.verifySession(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!session || session.status !== 'active') {
        throw new Error('Invalid or expired session');
      }

      return session;
    } catch (error) {
      console.error('Clerk session verification error:', error);
      throw new Error('Session verification failed');
    }
  }

  /**
   * Clerk kullanıcı bilgilerini alır
   */
  async getClerkUser(userId: string) {
    try {
      const user = await this.clerk.users.getUser(userId);
      return user;
    } catch (error) {
      console.error('Clerk user fetch error:', error);
      throw new Error('User fetch failed');
    }
  }

  /**
   * Firebase'de kullanıcı oluşturur veya günceller
   */
  async createOrUpdateFirebaseUser(clerkUser: any) {
    try {
      const uid = `clerk_${clerkUser.id}`;
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      const displayName = clerkUser.fullName || 
                         `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                         clerkUser.username ||
                         'Kullanıcı';
      const photoURL = clerkUser.imageUrl;

      // Firebase'de kullanıcı var mı kontrol et
      let firebaseUser;
      try {
        firebaseUser = await this.firebaseAuth.getUser(uid);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Kullanıcı yoksa oluştur
          firebaseUser = await this.firebaseAuth.createUser({
            uid,
            email,
            displayName,
            photoURL,
            emailVerified: clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
          });
        } else {
          throw error;
        }
      }

      // Kullanıcı varsa güncelle
      if (firebaseUser) {
        await this.firebaseAuth.updateUser(uid, {
          email,
          displayName,
          photoURL,
          emailVerified: clerkUser.emailAddresses?.[0]?.verification?.status === 'verified',
        });
      }

      return firebaseUser;
    } catch (error) {
      console.error('Firebase user creation/update error:', error);
      throw new Error('Firebase user operation failed');
    }
  }

  /**
   * Firebase custom token oluşturur
   */
  async createFirebaseCustomToken(clerkUserId: string, additionalClaims?: Record<string, any>) {
    try {
      const uid = `clerk_${clerkUserId}`;
      
      const customClaims = {
        clerk_user_id: clerkUserId,
        auth_provider: 'clerk',
        created_at: Date.now(),
        ...additionalClaims
      };

      const customToken = await this.firebaseAuth.createCustomToken(uid, customClaims);
      return customToken;
    } catch (error) {
      console.error('Firebase custom token creation error:', error);
      throw new Error('Custom token creation failed');
    }
  }

  /**
   * Clerk session'ından Firebase custom token oluşturur (Ana method)
   */
  async processClerkSessionToFirebaseToken(sessionToken: string) {
    try {
      // 1. Clerk session'ını doğrula
      const session = await this.verifyClerkSession(sessionToken);
      
      // 2. Clerk kullanıcı bilgilerini al
      const clerkUser = await this.getClerkUser(session.userId);
      
      // 3. Firebase'de kullanıcı oluştur/güncelle
      const firebaseUser = await this.createOrUpdateFirebaseUser(clerkUser);
      
      // 4. Firebase custom token oluştur
      const customToken = await this.createFirebaseCustomToken(clerkUser.id, {
        session_id: session.id,
        last_active_at: session.lastActiveAt,
      });

      return {
        success: true,
        firebaseToken: customToken,
        user: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses?.[0]?.emailAddress,
          displayName: clerkUser.fullName || 
                      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                      clerkUser.username ||
                      'Kullanıcı',
          photoURL: clerkUser.imageUrl,
          firebaseUid: firebaseUser.uid,
        }
      };
    } catch (error) {
      console.error('Clerk to Firebase token processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Firebase custom token'ı doğrular
   */
  async verifyFirebaseCustomToken(customToken: string) {
    try {
      const decodedToken = await this.firebaseAuth.verifyIdToken(customToken);
      return {
        success: true,
        decodedToken
      };
    } catch (error) {
      console.error('Firebase custom token verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  /**
   * Kullanıcı session'ını temizler
   */
  async revokeUserSessions(clerkUserId: string) {
    try {
      const uid = `clerk_${clerkUserId}`;
      await this.firebaseAuth.revokeRefreshTokens(uid);
      
      return {
        success: true,
        message: 'User sessions revoked successfully'
      };
    } catch (error) {
      console.error('Session revocation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session revocation failed'
      };
    }
  }

  /**
   * Kullanıcı custom claims'lerini günceller
   */
  async updateUserClaims(clerkUserId: string, customClaims: Record<string, any>) {
    try {
      const uid = `clerk_${clerkUserId}`;
      await this.firebaseAuth.setCustomUserClaims(uid, {
        clerk_user_id: clerkUserId,
        auth_provider: 'clerk',
        updated_at: Date.now(),
        ...customClaims
      });
      
      return {
        success: true,
        message: 'User claims updated successfully'
      };
    } catch (error) {
      console.error('User claims update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claims update failed'
      };
    }
  }
}

// Singleton instance
let clerkFirebaseBridgeService: ClerkFirebaseBridgeService;

export const getClerkFirebaseBridgeService = () => {
  if (!clerkFirebaseBridgeService) {
    clerkFirebaseBridgeService = new ClerkFirebaseBridgeService();
  }
  return clerkFirebaseBridgeService;
};

export { ClerkFirebaseBridgeService };
export default getClerkFirebaseBridgeService;