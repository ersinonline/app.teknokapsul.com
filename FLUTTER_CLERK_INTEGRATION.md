# Flutter Clerk Authentication Integration

Bu dokümantasyon Flutter uygulaması ile web uygulaması arasında Clerk authentication entegrasyonunu açıklar.

## Genel Bakış

Flutter uygulamasında Clerk ile giriş yapan kullanıcıların web uygulamasında otomatik olarak giriş yapması için güvenli bir token paylaşım protokolü geliştirilmiştir.

## Mimari

```
Flutter App (Clerk Auth) → WebView → Web App (Auto Login)
```

### 1. Flutter Tarafı (Mobil Uygulama)

#### Clerk SDK Kurulumu
```yaml
# pubspec.yaml
dependencies:
  clerk_flutter: ^1.0.0
  webview_flutter: ^4.0.0
```

#### Clerk Yapılandırması
```dart
// main.dart
import 'package:clerk_flutter/clerk_flutter.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClerkProvider(
      publishableKey: 'pk_test_your_publishable_key',
      child: MaterialApp(
        home: AuthScreen(),
      ),
    );
  }
}
```

#### Authentication ve WebView Entegrasyonu
```dart
// auth_screen.dart
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';

class AuthScreen extends StatefulWidget {
  @override
  _AuthScreenState createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late WebViewController _webViewController;
  String? _clerkSessionToken;

  @override
  void initState() {
    super.initState();
    _initializeClerk();
  }

  void _initializeClerk() async {
    // Clerk session'ını dinle
    Clerk.instance.addListener(() {
      final session = Clerk.instance.session;
      if (session != null) {
        setState(() {
          _clerkSessionToken = session.getToken();
        });
        _loadWebViewWithAuth();
      }
    });
  }

  void _loadWebViewWithAuth() {
    if (_clerkSessionToken != null) {
      final webUrl = 'https://app.teknokapsul.com/flutter-auth?clerk_token=$_clerkSessionToken';
      _webViewController.loadUrl(webUrl);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('TeknoKapsül')),
      body: Column(
        children: [
          // Clerk Auth UI
          if (_clerkSessionToken == null)
            Expanded(
              flex: 1,
              child: ClerkSignIn(
                onSignInComplete: (session) {
                  setState(() {
                    _clerkSessionToken = session.getToken();
                  });
                  _loadWebViewWithAuth();
                },
              ),
            ),
          
          // WebView
          if (_clerkSessionToken != null)
            Expanded(
              flex: 2,
              child: WebView(
                initialUrl: 'about:blank',
                onWebViewCreated: (controller) {
                  _webViewController = controller;
                  _loadWebViewWithAuth();
                },
                javascriptMode: JavascriptMode.unrestricted,
                javascriptChannels: {
                  JavascriptChannel(
                    name: 'FlutterInterface',
                    onMessageReceived: (message) {
                      // Web'den gelen mesajları işle
                      print('Web message: ${message.message}');
                    },
                  ),
                },
                onPageFinished: (url) {
                  // JavaScript interface'i inject et
                  _injectJavaScriptInterface();
                },
              ),
            ),
        ],
      ),
    );
  }

  void _injectJavaScriptInterface() {
    final jsCode = '''
      window.FlutterInterface = {
        getClerkToken: function() {
          return JSON.stringify({
            sessionToken: '$_clerkSessionToken',
            timestamp: Date.now()
          });
        },
        onAuthStatusChange: function(status) {
          console.log('Auth status changed:', status);
        }
      };
    ''';
    
    _webViewController.evaluateJavascript(jsCode);
  }
}
```

### 2. Web Uygulaması Tarafı

#### Route Yapılandırması
Web uygulamasında `/flutter-auth` route'u FlutterAuthBridge komponenti ile yapılandırılmıştır.

```typescript
// App.tsx
<Route path="/flutter-auth" element={
  <AuthProvider>
    <FlutterAuthBridge />
  </AuthProvider>
} />
```

#### FlutterAuthBridge Komponenti
- Flutter'dan gelen Clerk token'larını otomatik olarak algılar
- URL parametreleri, PostMessage ve JavaScript interface üzerinden token alır
- Backend API'ye token doğrulama isteği gönderir
- Başarılı authentication sonrası otomatik yönlendirme yapar

#### API Endpoint
`/api/flutter-clerk-auth` endpoint'i:
- Clerk session token'ını doğrular
- Firebase custom token oluşturur
- Kullanıcı bilgilerini döner

### 3. Güvenlik Protokolü

#### Token Güvenliği
1. **Kısa Ömürlü Token'lar**: Clerk session token'ları kısa ömürlüdür
2. **HTTPS Zorunluluğu**: Tüm token transferleri HTTPS üzerinden yapılır
3. **Origin Kontrolü**: Web uygulaması sadece güvenilir origin'lerden token kabul eder
4. **Token Doğrulama**: Backend'de Clerk API ile token doğrulaması yapılır

#### CORS Yapılandırması
```typescript
// API endpoint'inde CORS headers
res.setHeader('Access-Control-Allow-Origin', 'https://app.teknokapsul.com');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

#### Token Transfer Yöntemleri

1. **URL Parameters** (En Basit)
```
https://app.teknokapsul.com/flutter-auth?clerk_token=SESSION_TOKEN
```

2. **PostMessage API** (Güvenli)
```javascript
// Flutter WebView'dan
window.parent.postMessage({
  type: 'flutter_clerk_auth',
  sessionToken: 'SESSION_TOKEN'
}, 'https://app.teknokapsul.com');
```

3. **JavaScript Interface** (En Güvenli)
```javascript
// Flutter tarafından inject edilen interface
window.FlutterInterface = {
  getClerkToken: () => 'SESSION_TOKEN'
};
```

### 4. Kullanım Senaryoları

#### Senaryo 1: İlk Giriş
1. Kullanıcı Flutter uygulamasında Clerk ile giriş yapar
2. Flutter, WebView'ı `/flutter-auth?clerk_token=TOKEN` ile açar
3. Web uygulaması token'ı doğrular ve otomatik giriş yapar
4. Kullanıcı `/dashboard`'a yönlendirilir

#### Senaryo 2: Mevcut Session
1. Kullanıcı zaten Flutter'da giriş yapmış
2. WebView açıldığında JavaScript interface üzerinden token alınır
3. Otomatik giriş gerçekleşir

#### Senaryo 3: Token Yenileme
1. Clerk token'ı expire olduğunda Flutter yeni token alır
2. WebView'a yeni token gönderilir
3. Web uygulaması yeni token ile re-authenticate olur

### 5. Hata Yönetimi

#### Flutter Tarafı
```dart
void _handleAuthError(String error) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Giriş Hatası'),
      content: Text(error),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Tamam'),
        ),
      ],
    ),
  );
}
```

#### Web Tarafı
FlutterAuthBridge komponenti otomatik hata yönetimi sağlar:
- Token doğrulama hataları
- Network hataları
- Timeout hataları

### 6. Test Senaryoları

#### Unit Tests
```typescript
// FlutterAuthBridge.test.tsx
describe('FlutterAuthBridge', () => {
  it('should process valid Clerk token', async () => {
    // Test implementation
  });
  
  it('should handle invalid token gracefully', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
```dart
// flutter_integration_test.dart
void main() {
  group('Flutter Web Integration', () {
    testWidgets('should authenticate and load web app', (tester) async {
      // Test implementation
    });
  });
}
```

### 7. Deployment Notları

#### Environment Variables
```bash
# Flutter
CLERK_PUBLISHABLE_KEY=pk_test_...
WEB_APP_URL=https://app.teknokapsul.com

# Web App
CLERK_SECRET_KEY=sk_test_...
FIREBASE_ADMIN_SDK_KEY=...
```

#### Build Configuration
```yaml
# Flutter build.gradle
android {
    defaultConfig {
        manifestPlaceholders = [
            clerkRedirectScheme: "com.teknokapsul.app"
        ]
    }
}
```

### 8. Monitoring ve Analytics

#### Metrics
- Authentication success rate
- Token validation failures
- WebView load times
- User journey completion

#### Logging
```typescript
// Web tarafında
console.log('Flutter auth attempt', {
  timestamp: Date.now(),
  tokenLength: sessionToken.length,
  userAgent: navigator.userAgent
});
```

## Sonuç

Bu entegrasyon Flutter uygulamasında Clerk ile giriş yapan kullanıcıların web uygulamasında seamless bir deneyim yaşamasını sağlar. Güvenlik, performans ve kullanıcı deneyimi açısından optimize edilmiştir.