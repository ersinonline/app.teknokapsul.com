# TeknoKapsül WebView Kimlik Doğrulama Entegrasyonu

Bu belge, TeknoKapsül mobil uygulamasından WebView'a geçişte otomatik kimlik doğrulama entegrasyonunu açıklar.

## Genel Bakış

TeknoKapsül mobil uygulaması, kullanıcıların tekrar giriş yapmasına gerek kalmadan web uygulamasına sorunsuz geçiş yapabilmesini sağlar. Bu, mobil uygulamadan WebView'a Firebase kimlik doğrulama token'ı aktarılarak gerçekleştirilir.

## Entegrasyon Adımları

### 1. Mobil Uygulama Tarafı (Android)

```kotlin
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