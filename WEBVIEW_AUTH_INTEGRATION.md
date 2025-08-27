# TeknoKapsül WebView Kimlik Doğrulama Entegrasyonu

Bu belge, TeknoKapsül mobil uygulamasından WebView'a geçişte otomatik kimlik doğrulama entegrasyonunu açıklar.

## Genel Bakış

TeknoKapsül mobil uygulaması, kullanıcıların tekrar giriş yapmasına gerek kalmadan web uygulamasına sorunsuz geçiş yapabilmesini sağlar. Bu, mobil uygulamadan WebView'a Firebase kimlik doğrulama token'ı aktarılarak gerçekleştirilir.

## Entegrasyon Adımları

### 1. Mobil Uygulama Tarafı (Android)

#### Google Sign-In için Özel Ayarlar

WebView'da Google Sign-In'in cihazdaki hesabı kullanması için:

```kotlin
// Google Sign-In yapılandırması - WebView için optimize edilmiş
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken(getString(R.string.default_web_client_id))
    .requestEmail()
    .requestProfile()
    .setAccountName(null) // Cihazdaki varsayılan hesabı kullan
    .build()

val googleSignInClient = GoogleSignIn.getClient(this, gso)

// WebView'a token aktarımı
val currentUser = GoogleSignIn.getLastSignedInAccount(this)
currentUser?.let { account ->
    // Firebase ID token al
    FirebaseAuth.getInstance().currentUser?.getIdToken(true)
        ?.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val idToken = task.result?.token
                // WebView'a token aktar
                passTokenToWebView(idToken)
            }
        }
}

// WebView JavaScript interface
class WebViewInterface {
    @JavascriptInterface
    fun getAuthData(): String {
        val authData = JSONObject()
        authData.put("token", currentIdToken)
        authData.put("uid", FirebaseAuth.getInstance().currentUser?.uid)
        authData.put("provider", "google")
        return authData.toString()
    }
}

webView.addJavascriptInterface(WebViewInterface(), "AndroidInterface")
```

#### Apple Sign-In için Özel Ayarlar (iOS)

```swift
// Apple Sign-In yapılandırması - WebView için optimize edilmiş
import AuthenticationServices

class WebViewAuthManager: NSObject, ASAuthorizationControllerDelegate {
    
    func setupAppleSignIn() {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.performRequests()
    }
    
    func authorizationController(controller: ASAuthorizationController, 
                               didCompleteWithAuthorization authorization: ASAuthorization) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            // Firebase custom token oluştur ve WebView'a aktar
            createFirebaseCustomToken(appleIDCredential: appleIDCredential)
        }
    }
    
    private func createFirebaseCustomToken(appleIDCredential: ASAuthorizationAppleIDCredential) {
        // Backend'e Apple credential gönder ve Firebase custom token al
        // Sonra WebView'a aktar
    }
}
```

#### Genel WebView Ayarları

```kotlin
// WebView ayarları - Auth için optimize edilmiş
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    databaseEnabled = true
    setSupportMultipleWindows(false)
    javaScriptCanOpenWindowsAutomatically = false
    setSupportZoom(false)
    builtInZoomControls = false
    displayZoomControls = false
    
    // Güvenlik ayarları
    allowFileAccess = false
    allowContentAccess = false
    allowFileAccessFromFileURLs = false
    allowUniversalAccessFromFileURLs = false
    
    // Auth için gerekli ayarlar
    userAgentString = "$userAgentString TeknoKapsulWebView/1.0"
}

// WebView client ayarları
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString()
        
        // Firebase auth redirect URL'lerini yakala
        if (url?.contains("__/auth/handler") == true) {
            return false // WebView'da işle
        }
        
        // Diğer external URL'leri engelle
        return url?.startsWith("https://app.teknokapsul.info") != true
    }
    
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        
        // Sayfa yüklendikten sonra auth data'yı inject et
        injectAuthData()
    }
}

// Auth data injection
private fun injectAuthData() {
    val currentUser = FirebaseAuth.getInstance().currentUser
    currentUser?.getIdToken(true)?.addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val idToken = task.result?.token
            val script = """
                window.postMessage({
                    type: 'auth_data',
                    data: {
                        token: '$idToken',
                        uid: '${currentUser.uid}',
                        provider: 'mobile_app'
                    }
                }, '*');
            """.trimIndent()
            
            webView.evaluateJavascript(script, null)
        }
    }
}

// Firebase'den mevcut kullanıcının ID token'ını al
FirebaseAuth.getInstance().currentUser?.getIdToken(true)?.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val idToken = task.result?.token
        
        // WebView'a token'ı gönder
        if (idToken != null) {
            // 1. Yöntem: URL parametresi olarak
            val url = "https://app.teknokapsul.info?firebase_token=$idToken"
            webView.loadUrl(url)
            
            // 2. Yöntem: JavaScript interface üzerinden
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('AndroidMessage', " +
                        "{detail: JSON.stringify({type: 'auth_data', data: {token: '$idToken'}})}));",
                null
            )
        }
    }
}

// JavaScript interface tanımla
class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun getAuthData(): String {
        val user = FirebaseAuth.getInstance().currentUser
        return if (user != null) {
            val idToken = // Token'ı al (asenkron işlem gerektirir)
            "{\"token\":\"$idToken\", \"uid\":\"${user.id}\"}"
        } else {
            "{}"
        }
    }
}

// WebView'a JavaScript interface'i ekle
webView.addJavascriptInterface(WebAppInterface(this), "AndroidInterface")
```

### 2. Mobil Uygulama Tarafı (iOS)

#### WebView Ayarları - Auth için optimize edilmiş

```swift
import WebKit
import FirebaseAuth

class AuthWebViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    
    private var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadWebApp()
    }
    
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        
        // JavaScript message handler ekle
        config.userContentController.add(self, name: "authHandler")
        
        // Auth için gerekli ayarlar
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        // WebView oluştur
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // Custom User Agent
        webView.customUserAgent = "\(webView.customUserAgent ?? "") TeknoKapsulWebView/1.0"
        
        view.addSubview(webView)
    }
    
    private func loadWebApp() {
        guard let url = URL(string: "https://app.teknokapsul.info") else { return }
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Sayfa yüklendikten sonra auth data'yı inject et
        injectAuthData()
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        
        // Firebase auth redirect URL'lerini yakala
        if url.absoluteString.contains("__/auth/handler") {
            decisionHandler(.allow)
            return
        }
        
        // Sadece kendi domain'imize izin ver
        if url.host == "app.teknokapsul.info" {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
        }
    }
    
    // MARK: - Auth Data Injection
    
    private func injectAuthData() {
        Auth.auth().currentUser?.getIDToken { [weak self] (idToken, error) in
            guard let self = self, let idToken = idToken else { return }
            
            let script = """
                window.postMessage({
                    type: 'auth_data',
                    data: {
                        token: '\(idToken)',
                        uid: '\(Auth.auth().currentUser?.uid ?? "")',
                        provider: 'mobile_app'
                    }
                }, '*');
            """
            
            DispatchQueue.main.async {
                self.webView.evaluateJavaScript(script, completionHandler: nil)
            }
        }
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "authHandler" {
            // Web'den gelen auth mesajlarını işle
            print("Auth message received: \(message.body)")
        }
    }
}
```

#### Genel iOS WebView Ayarları

```swift
// Firebase'den mevcut kullanıcının ID token'ını al
Auth.auth().currentUser?.getIDToken(completion: { (idToken, error) in
    if let error = error {
        print("Error getting ID token: \(error)")
        return
    }
    
    if let idToken = idToken {
        // 1. Yöntem: URL parametresi olarak
        let urlString = "https://app.teknokapsul.info?firebase_token=\(idToken)"
        if let url = URL(string: urlString) {
            self.webView.load(URLRequest(url: url))
        }
        
        // 2. Yöntem: JavaScript üzerinden
        let script = "window.postMessage('\(self.createAuthDataJSON(token: idToken))', '*');"
        self.webView.evaluateJavaScript(script, completionHandler: nil)
    }
})

// Auth data JSON oluştur
func createAuthDataJSON(token: String) -> String {
    let data = ["type": "auth_data", "data": ["token": token, "uid": Auth.auth().currentUser?.uid ?? ""]]
    if let jsonData = try? JSONSerialization.data(withJSONObject: data),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        return jsonString
    }
    return "{}"
}
```

### 3. Web Uygulaması Tarafı

Web uygulaması, mobil uygulamadan gelen token'ı işlemek için hazır durumdadır. Aşağıdaki servisler otomatik olarak çalışır:

- `webview-auth.service.ts`: WebView tespiti ve kimlik doğrulama dinleyicisi
- `mobile-auth.service.ts`: Mobil token işleme ve giriş yapma

## Test Etme

1. Mobil uygulamada kullanıcı giriş yaptıktan sonra WebView'ı açın
2. WebView, otomatik olarak token'ı almalı ve kullanıcıyı giriş yapmalıdır
3. Kullanıcı, tekrar giriş yapmadan web uygulamasını kullanabilmelidir

## Sorun Giderme

### Yaygın Hatalar

1. **Token Aktarım Sorunu**: Mobil uygulamadan token aktarılmıyor
   - Mobil uygulama kodunu kontrol edin
   - WebView JavaScript köprüsünü kontrol edin

2. **Token Doğrulama Hatası**: Token geçersiz veya süresi dolmuş
   - Mobil uygulamada yeni token alın
   - Firebase projesi ayarlarını kontrol edin

3. **Domain Hatası**: Unauthorized domain hatası
   - Firebase Console > Authentication > Settings > Authorized Domains listesini kontrol edin

## Güvenlik Notları

- Token'lar URL'de geçirilirken, HTTPS kullanıldığından emin olun
- Token'lar kısa ömürlüdür, bu nedenle hızlı bir şekilde kullanılmalıdır
- WebView'da JavaScript'in etkin olduğundan emin olun

## Teknik Detaylar

### Token Akışı

1. Mobil uygulama, Firebase Authentication'dan bir ID token alır
2. Token, WebView'a aktarılır (URL parametresi veya JavaScript köprüsü ile)
3. Web uygulaması token'ı alır ve Firebase Authentication ile doğrular
4. Doğrulama başarılı olursa, kullanıcı otomatik olarak giriş yapar

### Güvenlik Önlemleri

- Token'lar sadece belirli domainlerde kullanılabilir (Firebase Console'da yapılandırılır)
- Token'lar kısa bir süre sonra geçerliliğini yitirir
- HTTPS zorunludur