# EmailJS Kurulum Rehberi - Borç Bildirimleri

Bu rehber, TeknokapsulApp'te borç eklendiğinde otomatik e-posta bildirimleri göndermek için EmailJS'in nasıl kurulacağını açıklar.

## 1. EmailJS Hesabı Oluşturma

1. [EmailJS](https://www.emailjs.com/) sitesine gidin
2. "Sign Up" butonuna tıklayarak ücretsiz hesap oluşturun
3. E-posta adresinizi doğrulayın

## 2. Email Service Kurulumu

1. EmailJS dashboard'a giriş yapın
2. "Email Services" sekmesine gidin
3. "Add New Service" butonuna tıklayın
4. Gmail, Outlook veya başka bir e-posta servisini seçin
5. E-posta hesabınızı bağlayın ve Service ID'yi not alın

## 3. Email Template Oluşturma

1. "Email Templates" sekmesine gidin
2. "Create New Template" butonuna tıklayın
3. Aşağıdaki template'i kullanın:

### Template Ayarları:
- **Template Name**: Debt Notification
- **Subject**: Yeni Borç Bildirimi - {{debt_description}}

### Template İçeriği:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Borç Bildirimi</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffb700; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .debt-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #d97706; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏦 TeknokapsulApp</h1>
            <h2>Yeni Borç Bildirimi</h2>
        </div>
        
        <div class="content">
            <p>Merhaba <strong>{{to_name}}</strong>,</p>
            
            <p>Sisteminize yeni bir borç kaydı eklenmiştir:</p>
            
            <div class="debt-info">
                <h3>📋 Borç Detayları</h3>
                <p><strong>Açıklama:</strong> {{debt_description}}</p>
                <p><strong>Tutar:</strong> <span class="amount">{{debt_amount}}</span></p>
                <p><strong>Alacaklı:</strong> {{debt_creditor}}</p>
                <p><strong>Son Ödeme Tarihi:</strong> {{debt_due_date}}</p>
                {{#debt_notes}}
                <p><strong>Notlar:</strong> {{debt_notes}}</p>
                {{/debt_notes}}
            </div>
            
            <p>⚠️ <strong>Hatırlatma:</strong> Ödeme tarihini takip etmeyi unutmayın!</p>
            
            <p>Bu borcu yönetmek için TeknokapsulApp'i ziyaret edebilirsiniz.</p>
        </div>
        
        <div class="footer">
            <p>Bu e-posta TeknokapsulApp tarafından otomatik olarak gönderilmiştir.</p>
            <p>© 2024 TeknokapsulApp - Finansal Yönetim Sistemi</p>
        </div>
    </div>
</body>
</html>
```

4. Template'i kaydedin ve Template ID'yi not alın

## 4. Environment Variables Kurulumu

`.env` dosyanızı oluşturun veya güncelleyin:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### Değerleri Alma:
- **Service ID**: Email Services sayfasından
- **Template ID**: Email Templates sayfasından  
- **Public Key**: Account > API Keys sayfasından

## 5. Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. Yeni bir borç ekleyin
3. E-posta adresinizi kontrol edin

## 6. Sorun Giderme

### E-posta Gönderilmiyor
- Environment variables'ların doğru ayarlandığından emin olun
- EmailJS dashboard'da quota'nızı kontrol edin (ücretsiz: 200 e-posta/ay)
- Browser console'da hata mesajlarını kontrol edin

### Template Görünmüyor
- Template ID'nin doğru olduğundan emin olun
- Template'in "Published" durumda olduğunu kontrol edin

### Spam Klasörü
- E-postalar spam klasörüne düşebilir
- EmailJS'den gelen e-postaları güvenli gönderen olarak işaretleyin

## 7. Ücretsiz Limitler

EmailJS ücretsiz planı:
- Ayda 200 e-posta
- 2 e-posta servisi
- 1 template

Daha fazla ihtiyaç için ücretli planlara geçiş yapabilirsiniz.

## 8. Güvenlik Notları

- Public Key'i frontend'de kullanmak güvenlidir
- Private Key'i asla frontend kodunda kullanmayın
- Environment variables'ları version control'e eklemeyin