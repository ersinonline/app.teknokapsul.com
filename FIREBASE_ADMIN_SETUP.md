# Firebase Admin SDK Kurulumu

Bu belge, TeknoKapsül uygulaması için Firebase Admin SDK'nın nasıl kurulacağını ve yapılandırılacağını açıklar.

## Gereksinimler

- Firebase projesi
- Firebase Admin SDK servis hesabı

## Adımlar

### 1. Firebase Admin SDK Servis Hesabı Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin ve projenizi seçin.
2. Sol menüden "Proje ayarları"nı seçin.
3. "Servis hesapları" sekmesine tıklayın.
4. "Yeni özel anahtar oluştur" düğmesine tıklayın.
5. JSON formatını seçin ve "Oluştur" düğmesine tıklayın.
6. Bir JSON dosyası indirilecektir. Bu dosya, Firebase Admin SDK'yı başlatmak için gereken kimlik bilgilerini içerir.

### 2. Ortam Değişkenlerini Ayarlama

İndirilen JSON dosyasından aşağıdaki bilgileri alın ve `.env` dosyanıza ekleyin:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
```

**Not:** `FIREBASE_PRIVATE_KEY` değerini ayarlarken, özel anahtarın tamamını kopyalayın ve çift tırnak içine alın. Ayrıca, satır sonlarını `\n` ile değiştirin.

### 3. Firebase Admin SDK'yı Kullanma

Uygulamanızda Firebase Admin SDK'yı kullanmak için `src/lib/firebase-admin.ts` dosyasını kullanabilirsiniz. Bu dosya, ortam değişkenlerini kullanarak Firebase Admin SDK'yı başlatır.

```typescript
import * as admin from 'firebase-admin';

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
```

### 4. API Endpoint'lerinde Kullanma

Firebase Admin SDK'yı API endpoint'lerinde kullanmak için `src/pages/api/mobile-auth.ts` dosyasını örnek olarak kullanabilirsiniz. Bu dosya, mobil uygulamadan gelen Firebase ID token'ını doğrular ve webview için özel bir token oluşturur.

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth } from '../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Webview için custom token oluştur
    const customToken = await adminAuth.createCustomToken(uid);

    // Custom token'ı döndür
    return res.status(200).json({ customToken });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}
```

## Güvenlik Notları

- `.env` dosyasını asla GitHub'a push etmeyin. Bu dosya, hassas bilgiler içerir.
- Firebase Admin SDK servis hesabı anahtarını güvenli bir şekilde saklayın ve asla paylaşmayın.
- Üretim ortamında, ortam değişkenlerini güvenli bir şekilde ayarlamak için hosting sağlayıcınızın (Vercel, Netlify, vb.) ortam değişkenleri özelliğini kullanın.