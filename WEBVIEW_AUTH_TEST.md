# WebView Authentication Test Rehberi

Bu belge, TeknoKapsül uygulamasında WebView authentication flow'unun nasıl test edileceğini açıklar.

## Test Senaryoları

### 1. WebView Tespiti Testi

#### Browser Developer Tools ile Test

```javascript
// Console'da çalıştırın - WebView simülasyonu
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.181 Mobile Safari/537.36 wv TeknoKapsulWebView/1.0',
  writable: false
});

// WebView interface simülasyonu
window.AndroidInterface = {
  getAuthData: () => JSON.stringify({
    token: 'test_firebase_token_here',
    uid: 'test_user_id',
    provider: 'google'
  })
};

// Auth data mesajı gönder
window.postMessage({
  type: 'auth_data',
  data: {
    token: 'test_firebase_token_here',
    uid: 'test_user_id',
    provider: 'mobile_app'
  }
}, '*');
```

### 2. Google Sign-In WebView Testi

#### Test Adımları:

1. **WebView Simülasyonu Aktif Et**
   ```javascript
   // Console'da çalıştır
   localStorage.setItem('webview_test_mode', 'true');
   window.location.reload();
   ```

2. **Google Sign-In Butonuna Tıkla**
   - Popup yerine redirect kullanılmalı
   - Chrome açılmamalı
   - Cihazdaki Google hesabı kullanılmalı

3. **Console Loglarını Kontrol Et**
   ```
   ✅ Beklenen loglar:
   🚀 Google popup giriş başlatılıyor...
   📱 WebView tespit edildi, redirect kullanılıyor
   ```

### 3. Apple Sign-In WebView Testi

#### Test Adımları:

1. **Apple Sign-In Butonuna Tıkla**
   - WebView için optimize edilmiş response_mode kullanılmalı
   - Popup yerine redirect kullanılmalı

2. **Console Loglarını Kontrol Et**
   ```
   ✅ Beklenen loglar:
   🚀 Apple popup giriş başlatılıyor...
   📱 WebView tespit edildi, redirect kullanılıyor
   ```

### 4. Token Injection Testi

#### Mobil Token Simülasyonu:

```javascript
// Console'da çalıştır - Mobil uygulamadan token geldiğini simüle et
const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...';

// URL parametresi ile test
window.history.pushState({}, '', `?firebase_token=${mockFirebaseToken}`);
window.location.reload();

// veya PostMessage ile test
window.postMessage({
  type: 'auth_data',
  data: {
    token: mockFirebaseToken,
    uid: 'test_user_123',
    provider: 'mobile_app'
  }
}, '*');
```

## Beklenen Davranışlar

### ✅ Başarılı WebView Auth Flow

1. **WebView Tespiti**: Uygulama WebView ortamını doğru tespit etmeli
2. **Popup Engelleme**: Hiçbir popup penceresi açılmamalı
3. **Redirect Kullanımı**: Tüm auth işlemleri redirect ile yapılmalı
4. **Token İşleme**: Mobil uygulamadan gelen token'lar doğru işlenmeli
5. **Otomatik Giriş**: Kullanıcı tekrar giriş yapmadan uygulamayı kullanabilmeli

### ❌ Sorunlu Durumlar

1. **Chrome Açılması**: Google Sign-In Chrome'da açılıyorsa
2. **Popup Hataları**: `auth/popup-blocked` hataları alınıyorsa
3. **Token Hataları**: `auth/invalid-custom-token` hataları alınıyorsa
4. **WebView Tespit Hatası**: Normal browser olarak algılanıyorsa

## Debugging

### Console Komutları

```javascript
// WebView durumunu kontrol et
console.log('WebView detected:', webViewAuthService.isWebView);

// Auth state'ini kontrol et
console.log('Current user:', auth.currentUser);

// Local storage'daki token'ları kontrol et
console.log('Stored tokens:', {
  firebaseIdToken: localStorage.getItem('firebaseIdToken'),
  customToken: localStorage.getItem('customToken')
});

// WebView auth service durumunu kontrol et
console.log('WebView auth service:', webViewAuthService);
```

### Network Tab Kontrolü

1. **Firebase Auth Requests**: `identitytoolkit.googleapis.com` istekleri
2. **Token Verification**: `/api/mobile-auth` endpoint'i
3. **Redirect URLs**: `__/auth/handler` URL'leri

## Mobil Uygulama Entegrasyonu

### Android Test Kodu

```kotlin
// Test için WebView'a token inject et
private fun testTokenInjection() {
    val testToken = "test_firebase_token_here"
    val script = """
        window.postMessage({
            type: 'auth_data',
            data: {
                token: '$testToken',
                uid: 'test_user_123',
                provider: 'mobile_app'
            }
        }, '*');
    """.trimIndent()
    
    webView.evaluateJavascript(script, null)
}
```

### iOS Test Kodu

```swift
// Test için WebView'a token inject et
private func testTokenInjection() {
    let testToken = "test_firebase_token_here"
    let script = """
        window.postMessage({
            type: 'auth_data',
            data: {
                token: '\(testToken)',
                uid: 'test_user_123',
                provider: 'mobile_app'
            }
        }, '*');
    """
    
    webView.evaluateJavaScript(script, completionHandler: nil)
}
```

## Sorun Giderme

### Yaygın Hatalar ve Çözümleri

1. **WebView Tespit Edilmiyor**
   - User Agent string'ini kontrol edin
   - `TeknoKapsulWebView/1.0` eklenmeli

2. **Token Geçersiz**
   - Firebase project ID'yi kontrol edin
   - Token'ın süresi dolmuş olabilir

3. **Popup Hala Açılıyor**
   - `isWebView()` fonksiyonunu kontrol edin
   - WebView tespiti çalışmıyor olabilir

4. **Auth Redirect Çalışmıyor**
   - Firebase Console'da authorized domains kontrol edin
   - `app.teknokapsul.info` eklenmiş olmalı

## Test Checklist

- [ ] WebView tespiti çalışıyor
- [ ] Google Sign-In popup açmıyor
- [ ] Apple Sign-In popup açmıyor
- [ ] Token injection çalışıyor
- [ ] Otomatik giriş yapılıyor
- [ ] Chrome açılmıyor
- [ ] Redirect auth flow çalışıyor
- [ ] Error handling doğru çalışıyor
- [ ] Console'da doğru loglar görünüyor
- [ ] Network requests başarılı

## Performans Metrikleri

- **Auth Flow Süresi**: < 3 saniye
- **Token Verification**: < 1 saniye
- **WebView Detection**: < 100ms
- **Page Load After Auth**: < 2 saniye