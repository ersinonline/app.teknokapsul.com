import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

// CORS ayarları
const corsHandler = cors({ origin: true });

/**
  * İş Bankası kullanıcıları için custom token oluşturma endpoint'i
  */
 export const createIsBankUser = functions.https.onRequest((req, res) => {
   corsHandler(req, res, async () => {
     // Sadece POST isteklerini kabul et
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method Not Allowed' });
     }
 
     try {
       const { userInfo } = req.body;
 
       if (!userInfo || !userInfo.id || !userInfo.email) {
         return res.status(400).json({ error: 'userInfo ve gerekli alanlar (id, email) zorunlu' });
       }
 
       // İş Bankası kullanıcı ID'sini Firebase UID olarak kullan
       const uid = `isbank_${userInfo.id}`;
       
       try {
         // Kullanıcının zaten var olup olmadığını kontrol et
         await admin.auth().getUser(uid);
         console.log('İş Bankası kullanıcısı zaten mevcut:', uid);
       } catch (error: any) {
         if (error.code === 'auth/user-not-found') {
           // Kullanıcı yoksa oluştur
            await admin.auth().createUser({
              uid: uid,
              email: userInfo.email,
              displayName: userInfo.name,
              phoneNumber: userInfo.phone || undefined,
              emailVerified: userInfo.verified || false
            });
            
            // Kullanıcı için custom claims ayarla
            await admin.auth().setCustomUserClaims(uid, {
              isBankUser: true,
              provider: 'isbank',
              bankUserId: userInfo.id,
              verified: userInfo.verified || false
            });
           console.log('İş Bankası kullanıcısı oluşturuldu:', uid);
         } else {
           throw error;
         }
       }
 
       // İş Bankası kullanıcısı için özel claims
       const customClaims = {
         isBankUser: true,
         provider: 'isbank',
         bankUserId: userInfo.id,
         verified: userInfo.verified || false
       };
 
       // Custom token oluştur
       const customToken = await admin.auth().createCustomToken(uid, customClaims);
 
       return res.status(200).json({ 
         success: true,
         customToken,
         uid: uid,
         claims: customClaims
       });
     } catch (error: any) {
       console.error('İş Bankası custom token oluşturma hatası:', error);
       
       return res.status(500).json({ 
         success: false,
         error: 'Sunucu hatası: ' + error.message 
       });
     }
   });
 });

// Firebase Admin SDK'yı başlat (eğer başlatılmamışsa)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ID Token doğrulama ve kullanıcı bilgilerini döndürme endpoint'i
 */
export const verifyIdToken = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'ID token gerekli' });
      }

      // Firebase ID token'ını doğrula
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Kullanıcı bilgilerini al
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      
      // Güvenli kullanıcı bilgilerini döndür
      const userInfo = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        },
        customClaims: decodedToken
      };

      return res.status(200).json({ 
        success: true, 
        user: userInfo,
        tokenValid: true
      });
    } catch (error: any) {
      console.error('Token doğrulama hatası:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token süresi dolmuş' });
      } else if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({ error: 'Token iptal edilmiş' });
      } else if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({ error: 'Geçersiz token' });
      } else {
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }
  });
});

/**
 * Custom token oluşturma endpoint'i (WebView için)
 */
export const createCustomToken = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { uid, idToken } = req.body;

      let userId: string;

      if (uid) {
        // Doğrudan uid kullan
        userId = uid;
      } else if (idToken) {
        // ID token'ı doğrula ve uid'i çıkar
        try {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          userId = decodedToken.uid;
        } catch (tokenError: any) {
          console.error('ID token doğrulama hatası:', tokenError);
          
          if (tokenError.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token süresi dolmuş' });
          } else if (tokenError.code === 'auth/invalid-id-token' || tokenError.code === 'auth/argument-error') {
            return res.status(400).json({ error: 'Geçersiz ID token formatı' });
          } else {
            return res.status(400).json({ error: 'ID token doğrulanamadı: ' + tokenError.message });
          }
        }
      } else {
        return res.status(400).json({ error: 'uid veya idToken gerekli' });
      }

      // WebView için custom token oluştur
      const customToken = await admin.auth().createCustomToken(userId);

      return res.status(200).json({ 
        success: true,
        customToken 
      });
    } catch (error: any) {
      console.error('Custom token oluşturma hatası:', error);
      
      if (error.code === 'auth/uid-not-found') {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      } else {
        return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
      }
    }
  });
});

/**
 * Kullanıcı oturum durumunu kontrol etme endpoint'i
 */
export const checkSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ 
          success: false,
          sessionValid: false,
          error: 'Token bulunamadı' 
        });
      }

      // Firebase ID token'ını doğrula
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      return res.status(200).json({ 
        success: true,
        sessionValid: true,
        uid: decodedToken.uid,
        exp: decodedToken.exp
      });
    } catch (error: any) {
      console.error('Oturum kontrol hatası:', error);
      
      return res.status(200).json({ 
        success: false,
        sessionValid: false,
        error: error.message
      });
    }
  });
});