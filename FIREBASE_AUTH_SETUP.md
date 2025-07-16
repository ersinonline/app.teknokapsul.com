# Firebase Authentication Kurulum Rehberi

## Sorun Analizi
Sitede Google, Apple ve SMS girişlerinde yaşanan sorunlar:

1. **Domain Yetkilendirme Hatası**: `auth/unauthorized-domain`
2. **reCAPTCHA Enterprise Hatası**: `auth/captcha-check-failed`
3. **SMS Doğrulama Hatası**: Firebase Identity Toolkit API hatası

## Çözüm Adımları

### 1. Firebase Console Ayarları

#### Authentication > Settings > Authorized Domains
Aşağıdaki domainleri ekleyin:
- `app.teknokapsul.info`
- `teknokapsul.info`
- `localhost` (geliştirme için)
- `127.0.0.1` (geliştirme için)

#### Authentication > Sign-in Method

**Google Provider:**
- Durumu: Etkin
- Web SDK configuration: Doğru Project ID ve Client ID
- Authorized domains listesinde domain'in bulunduğundan emin olun

**Apple Provider:**
- Durumu: Etkin
- Service ID, Team ID, Key ID ve Private Key doğru şekilde yapılandırılmalı
- Return URLs: `https://app.teknokapsul.info/__/auth/handler`

**Phone Provider:**
- Durumu: Etkin
- reCAPTCHA Enterprise ayarları yapılandırılmalı
- Test phone numbers (isteğe bağlı)

### 2. reCAPTCHA Enterprise Kurulumu

1. Google Cloud Console'da reCAPTCHA Enterprise API'yi etkinleştirin
2. reCAPTCHA Enterprise site key oluşturun:
   - Site type: Website
   - Domains: `app.teknokapsul.info`, `teknokapsul.info`
3. Firebase Console'da reCAPTCHA Enterprise'ı etkinleştirin
4. Site key'i Firebase Authentication ayarlarına ekleyin

### 3. Firebase Project Ayarları

#### Project Settings > General
- Public-facing name: TeknoKapsül
- Project ID: Doğru project ID
- Web API Key: Doğru API key

#### Project Settings > Service Accounts
- Admin SDK configuration snippet'inin doğru olduğundan emin olun

### 4. Hosting Ayarları

#### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          }
        ]
      }
    ]
  }
}
```

### 5. Environment Variables

`.env` dosyasında doğru Firebase config değerlerinin bulunduğundan emin olun:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 6. Kod Değişiklikleri

✅ **Tamamlanan Düzeltmeler:**
- SocialLogin.tsx: reCAPTCHA konfigürasyonu iyileştirildi
- AuthContext.tsx: getRedirectResult eklendi
- Popup yerine redirect method kullanımına geçildi
- Hata yönetimi iyileştirildi

### 7. Test Adımları

1. Firebase Console'da tüm ayarların doğru olduğunu kontrol edin
2. Authorized domains listesini güncelleyin
3. reCAPTCHA Enterprise kurulumunu tamamlayın
4. Uygulamayı yeniden deploy edin
5. Farklı giriş yöntemlerini test edin

### 8. Debugging

Sorun devam ederse:

1. Browser Developer Tools > Console'da hata mesajlarını kontrol edin
2. Network tab'ında Firebase API çağrılarını inceleyin
3. Firebase Console > Authentication > Users'da giriş denemelerini kontrol edin
4. Firebase Console > Analytics > Events'da authentication eventlerini inceleyin

## Önemli Notlar

- Domain değişikliklerinden sonra DNS propagation süresi bekleyin (24 saat)
- Firebase Console'daki değişiklikler birkaç dakika içinde aktif olur
- reCAPTCHA Enterprise kurulumu için Google Cloud Console erişimi gerekir
- Test ortamında localhost ve 127.0.0.1 domainlerini unutmayın