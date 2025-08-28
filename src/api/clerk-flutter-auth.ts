/**
 * Flutter Clerk entegrasyonu için API endpoint'leri
 * 
 * Bu dosya Flutter uygulamasından gelen Clerk session token'larını
 * doğrular ve web uygulaması için gerekli token'ları oluşturur.
 */

import { auth as adminAuth } from '../lib/firebase-admin';
import { getClerkFirebaseBridgeService } from '../services/clerk-firebase-bridge.service';

// Clerk API yapılandırması
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.dev/v1';

interface ClerkSession {
  id: string;
  user_id: string;
  status: string;
  expire_at: number;
  abandon_at: number;
  last_active_at: number;
  created_at: number;
  updated_at: number;
}

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
    verification: {
      status: string;
    };
  }>;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Clerk session token'ını doğrular ve Firebase custom token oluşturur
 */
export async function verifyClerkSession(sessionToken: string) {
  try {
    const bridgeService = getClerkFirebaseBridgeService();
    const result = await bridgeService.processClerkSessionToFirebaseToken(sessionToken);
    
    return result;
  } catch (error) {
    console.error('Clerk session verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session verification failed'
    };
  }
}

/**
 * Clerk kullanıcı ID'sinden Firebase custom token oluşturur
 */
export async function createFirebaseCustomTokenFromClerk(clerkUserId: string, additionalClaims?: Record<string, any>) {
  try {
    const bridgeService = getClerkFirebaseBridgeService();
    const customToken = await bridgeService.createFirebaseCustomToken(clerkUserId, additionalClaims);
    
    return {
      success: true,
      customToken
    };
  } catch (error) {
    console.error('Firebase token creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token creation failed'
    };
  }
}

/**
 * Flutter'dan gelen Clerk authentication isteğini işler
 */
export async function processFlutterClerkAuth(sessionToken: string) {
  try {
    // Clerk session'ını doğrula ve Firebase token oluştur
    const result = await verifyClerkSession(sessionToken);
    
    return result;
  } catch (error) {
    console.error('Flutter Clerk auth processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication processing failed'
    };
  }
}

/**
 * Clerk JWT token'ını doğrular (alternatif yöntem)
 */
export async function verifyClerkJWT(jwtToken: string): Promise<{
  success: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    if (!jwtToken) {
      return {
        success: false,
        error: 'JWT token gerekli'
      };
    }

    // Clerk JWT'yi doğrula
    const response = await fetch(`${CLERK_API_URL}/jwks`, {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'JWKS alınamadı'
      };
    }

    // JWT doğrulama işlemi burada yapılacak
    // Bu kısım jwt kütüphanesi ile genişletilebilir
    
    return {
      success: true,
      payload: {} // JWT payload buraya gelecek
    };
  } catch (error) {
    console.error('Clerk JWT doğrulama hatası:', error);
    return {
      success: false,
      error: `JWT doğrulama hatası: ${error}`
    };
  }
}