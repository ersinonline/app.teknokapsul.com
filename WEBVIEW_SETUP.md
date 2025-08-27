# Flutter WebView Entegrasyonu Rehberi

TeknoKapsül web uygulaması Flutter WebView içinde kullanım için optimize edilmiştir. Bu rehber, Flutter geliştiricileri için native OAuth entegrasyonu ve WebView yapılandırması adımlarını içerir.

## 🔧 Yapılan Değişiklikler

### 1. WebView Detection
- `src/utils/webview.ts` - WebView algılama ve mesaj yönetimi
- Otomatik WebView türü tespiti (iOS, Android, React Native)
- Native app ile iletişim için message handling

### 2. Auth Yapılandırması
- `src/main.tsx` - Clerk WebView desteği eklendi
- `src/contexts/AuthContext.tsx` - WebView auth state yönetimi
- `src/components/auth/WebViewSafeAuth.tsx` - WebView-safe OAuth bileşeni
- `src/pages/auth/OAuthCallbackPage.tsx` - OAuth callback handler

### 3. Güvenlik ve Yönlendirme
- Allowed redirect origins yapılandırıldı
- WebView içinde popup yerine redirect mode kullanılıyor
- Native OAuth desteği eklendi

## 📱 Flutter WebView Entegrasyonu

### 1. Gerekli Paketler

`pubspec.yaml` dosyanıza aşağıdaki paketleri ekleyin:

```yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.4.2
  google_sign_in: ^6.1.5
  sign_in_with_apple: ^5.0.0
  url_launcher: ^6.2.1
```

### 2. Flutter WebView Yapılandırması

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class TeknoKapsulWebView extends StatefulWidget {
  @override
  _TeknoKapsulWebViewState createState() => _TeknoKapsulWebViewState();
}

class _TeknoKapsulWebViewState extends State<TeknoKapsulWebView> {
  late final WebViewController _controller;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  @override
  void initState() {
    super.initState();
    
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Progress indicator
          },
          onPageStarted: (String url) {
            // Page loading started
          },
          onPageFinished: (String url) {
            // Inject JavaScript for WebView detection
            _injectWebViewDetection();
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterApp',
        onMessageReceived: (JavaScriptMessage message) {
          _handleWebViewMessage(message.message);
        },
      )
      ..loadRequest(Uri.parse('https://app.teknokapsul.com'));
  }

  void _injectWebViewDetection() {
    _controller.runJavaScript("""
      // WebView detection için Flutter flag'i ekle
      window.FlutterWebView = true;
      window.userAgent = navigator.userAgent + ' TeknoKapsul-Flutter';
      
      // Native app message handler
      window.sendMessageToFlutter = function(message) {
        FlutterApp.postMessage(JSON.stringify(message));
      };
    """);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('TeknoKapsül'),
        backgroundColor: Colors.blue,
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

### 2. Message Handling

Web uygulaması aşağıdaki mesajları gönderir:

```javascript
// WebView hazır olduğunda
{
  type: 'webview_ready',
  url: 'https://app.teknokapsul.com',
  userAgent: 'Mozilla/5.0...',
  webViewType: 'ios' | 'android' | 'react-native'
}

// Kullanıcı giriş yaptığında
{
  type: 'user_signed_in',
  user: {
    id: 'user_123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: 'https://...'
  },
  timestamp: 1640995200000
}

// Kullanıcı çıkış yaptığında
{
  type: 'user_signed_out',
  timestamp: 1640995200000
}

// OAuth giriş talebi
{
  type: 'oauth_request',
  provider: 'google' | 'apple' | 'facebook',
  mode: 'sign-in' | 'sign-up',
  timestamp: 1640995200000
}
```

### 3. Native OAuth Handling

```dart
class _TeknoKapsulWebViewState extends State<TeknoKapsulWebView> {
  // ... önceki kod ...

  void _handleWebViewMessage(String message) {
    try {
      final data = jsonDecode(message);
      
      switch (data['type']) {
        case 'oauth_request':
          _handleOAuthRequest(data['provider'], data['mode']);
          break;
        case 'webview_ready':
          print('WebView hazır: ${data['url']}');
          break;
        default:
          print('Bilinmeyen mesaj: $message');
      }
    } catch (e) {
      print('Mesaj parse hatası: $e');
    }
  }

  Future<void> _handleOAuthRequest(String provider, String mode) async {
    try {
      switch (provider) {
        case 'google':
          await _handleGoogleSignIn(mode);
          break;
        case 'apple':
          await _handleAppleSignIn(mode);
          break;
        default:
          _sendOAuthError('Desteklenmeyen provider: $provider');
      }
    } catch (e) {
      _sendOAuthError('OAuth hatası: $e');
    }
  }

  Future<void> _handleGoogleSignIn(String mode) async {
    try {
      // Mevcut oturumu temizle
      await _googleSignIn.signOut();
      
      // Google Sign-In başlat
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      
      if (account == null) {
        _sendOAuthError('Kullanıcı Google girişini iptal etti');
        return;
      }

      // Authentication token al
      final GoogleSignInAuthentication auth = await account.authentication;
      
      if (auth.idToken == null) {
        _sendOAuthError('Google ID token alınamadı');
        return;
      }

      // WebView'a başarı mesajı gönder
      _sendOAuthSuccess(auth.idToken!);
      
    } catch (e) {
      _sendOAuthError('Google Sign-In hatası: $e');
    }
  }

  Future<void> _handleAppleSignIn(String mode) async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      if (credential.identityToken == null) {
        _sendOAuthError('Apple ID token alınamadı');
        return;
      }

      // WebView'a başarı mesajı gönder
      _sendOAuthSuccess(credential.identityToken!);
      
    } catch (e) {
      _sendOAuthError('Apple Sign-In hatası: $e');
    }
  }

  void _sendOAuthSuccess(String token) {
    final message = {
      'type': 'oauth_success',
      'token': token,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    
    _controller.runJavaScript("""
      window.postMessage(${jsonEncode(message)}, '*');
      if (window.document && window.document.dispatchEvent) {
        window.document.dispatchEvent(new MessageEvent('message', {
          data: ${jsonEncode(jsonEncode(message))}
        }));
      }
    """);
  }

  void _sendOAuthError(String error) {
    final message = {
      'type': 'oauth_error',
      'error': error,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    
    _controller.runJavaScript("""
      window.postMessage(${jsonEncode(message)}, '*');
      if (window.document && window.document.dispatchEvent) {
        window.document.dispatchEvent(new MessageEvent('message', {
          data: ${jsonEncode(jsonEncode(message))}
        }));
      }
    """);
  }
}
```

### 4. Platform Yapılandırması

#### Android Yapılandırması

`android/app/build.gradle` dosyasına Google Sign-In için:

```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

`android/app/src/main/AndroidManifest.xml` dosyasına:

```xml
<application>
    <!-- Google Sign-In için -->
    <meta-data
        android:name="com.google.android.gms.version"
        android:value="@integer/google_play_services_version" />
</application>
```

#### iOS Yapılandırması

`ios/Runner/Info.plist` dosyasına Google Sign-In için:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>REVERSED_CLIENT_ID</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

Apple Sign-In için `ios/Runner/Runner.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
</dict>
</plist>
```

## 🔐 Güvenlik ve Yapılandırma

### 1. Firebase/Google Console Yapılandırması

- **Google Cloud Console**'da projenizi oluşturun
- **OAuth 2.0 Client ID**'leri oluşturun (Android ve iOS için ayrı ayrı)
- **SHA-1 fingerprint**'leri Android için ekleyin
- **Bundle ID**'yi iOS için doğru şekilde ayarlayın

### 2. Apple Developer Console

- **Sign in with Apple** capability'sini aktifleştirin
- **App ID**'nizi yapılandırın
- **Service ID** oluşturun (web için)

### 3. Güvenlik Önlemleri

1. **HTTPS Kullanımı**: Sadece HTTPS üzerinden bağlantı kurun
2. **Token Güvenliği**: OAuth tokenları güvenli şekilde saklayın
3. **Domain Doğrulama**: Sadece `app.teknokapsul.com` domain'ine izin verin
4. **Certificate Pinning**: Ek güvenlik için SSL certificate pinning kullanın
5. **Biometric Authentication**: Hassas işlemler için biyometrik doğrulama ekleyin

## 🧪 Test Etme

### 1. Flutter WebView Test Adımları

```dart
// Test için debug modunda log ekleyin
void _handleWebViewMessage(String message) {
  print('WebView Message: $message'); // Debug için
  // ... mevcut kod
}

void _sendOAuthSuccess(String token) {
  print('OAuth Success - Token: ${token.substring(0, 20)}...'); // Debug için
  // ... mevcut kod
}
```

### 2. Test Senaryoları

1. **WebView Yükleme**: `https://app.teknokapsul.com` adresinin doğru yüklendiğini kontrol edin
2. **JavaScript Injection**: WebView detection'ın çalıştığını console'da kontrol edin
3. **Google Sign-In**: Google giriş butonuna tıklayın ve native akışın başladığını doğrulayın
4. **Apple Sign-In**: Apple giriş butonuna tıklayın ve Face ID/Touch ID akışını test edin
5. **Token Transfer**: OAuth token'ının WebView'a doğru şekilde gönderildiğini kontrol edin
6. **Error Handling**: İptal etme ve hata durumlarını test edin

### 3. Debug Komutları

```bash
# Android için logları izleyin
adb logcat | grep -i "teknokapsul\|oauth\|google\|apple"

# iOS için Xcode console'unu kullanın
# Flutter logs
flutter logs
```

## 🚀 Deployment ve Production

### 1. Release Build Yapılandırması

```bash
# Android release build
flutter build apk --release

# iOS release build
flutter build ios --release
```

### 2. Production Checklist

- [ ] Google OAuth Client ID'leri production için ayarlandı
- [ ] Apple Sign-In production sertifikaları eklendi
- [ ] WebView URL'i production domain'e ayarlandı (`https://app.teknokapsul.com`)
- [ ] SSL Certificate Pinning aktifleştirildi
- [ ] Debug logları production'da kapatıldı
- [ ] Biometric authentication test edildi

## 🔧 Sorun Giderme

### Yaygın Sorunlar

1. **Google Sign-In Çalışmıyor**
   - SHA-1 fingerprint'lerin doğru olduğunu kontrol edin
   - `google-services.json` dosyasının güncel olduğunu doğrulayın

2. **Apple Sign-In Çalışmıyor**
   - Bundle ID'nin Apple Developer Console ile eşleştiğini kontrol edin
   - Entitlements dosyasının doğru yapılandırıldığını doğrulayın

3. **WebView Message Çalışmıyor**
   - JavaScript injection'ın doğru çalıştığını kontrol edin
   - Message channel'ın doğru adlandırıldığını doğrulayın

## 📞 Destek

Flutter WebView entegrasyonu ile ilgili sorunlar için:
- GitHub Issues: [teknokapsul/app](https://github.com/teknokapsul/app/issues)
- Email: destek@teknokapsul.com
- Flutter Documentation: [webview_flutter](https://pub.dev/packages/webview_flutter)

---

**Not**: Bu yapılandırma Flutter WebView ve Clerk authentication sistemi ile optimize edilmiştir. Native OAuth entegrasyonu sayesinde kullanıcılar telefondaki mevcut hesaplarıyla sorunsuz giriş yapabilir.