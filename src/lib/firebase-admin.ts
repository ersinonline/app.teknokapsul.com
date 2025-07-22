// Firebase Admin SDK - Sadece sunucu tarafında çalışır
let admin: any = null;
let auth: any = null;
let db: any = null;

// Tarayıcı ortamında çalışmıyorsa admin SDK'yı yükle
if (typeof window === 'undefined') {
  try {
    admin = require('firebase-admin');
    
    // Firebase Admin SDK'yı başlat
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('Firebase Admin SDK başarıyla başlatıldı');
    }
    
    auth = admin.auth();
    db = admin.firestore();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  // Tarayıcı ortamında boş objeler döndür
  auth = {};
  db = {};
  admin = {};
}

export { auth, db };
export default admin;