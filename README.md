# TeknokapsulApp - Modern Finance Management Platform

Bu proje, React + TypeScript + Vite kullanılarak geliştirilmiş modern bir finans yönetim platformudur.

## 🚀 Özellikler

- **Gelir/Gider Takibi**: Aylık gelir ve giderlerinizi detaylı şekilde takip edin
- **Portföy Yönetimi**: Yatırım portföyünüzü yönetin ve analiz edin
- **Kargo Takibi**: Kargo gönderilerinizi takip edin
- **AI Destekli Analizler**: Finansal verilerinizi AI ile analiz edin
- **Mobil Uyumlu**: Responsive tasarım ile tüm cihazlarda kullanım
- **Firebase Entegrasyonu**: Güvenli veri saklama ve kullanıcı yönetimi

## 🛠️ Teknolojiler

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Deployment**: Vercel
- **State Management**: React Context API

## 📦 Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd app.teknokapsul.com
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables dosyasını oluşturun:
```bash
cp .env.example .env
```

4. `.env` dosyasını Firebase yapılandırmanızla güncelleyin:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## 📧 Email Reminder Sistemi

### Vercel Cron ile Otomatik Email Hatırlatmaları

Proje, gider ödemelerinin 3 gün öncesinden email hatırlatması gönderen bir sistem içerir:

- **Vercel Cron**: Her gün saat 16:34'te çalışır
- **API Route**: `/api/expense-reminders` endpoint'i
- **Google Sheets Entegrasyonu**: `/api/google-sheets-sync` ile Google Sheets entegrasyonu mümkün

### Gerekli Environment Variables

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_PASSWORD=your_gmail_app_password

# Security
CRON_SECRET=your_random_secret_key

# Google Sheets Integration (Optional)
GOOGLE_SHEETS_WEBHOOK_URL=your_google_apps_script_webhook_url
```

## 🚀 Deployment
### Vercel'e Deploy Etme

1. Vercel hesabınızı GitHub ile bağlayın
2. Projeyi Vercel'e import edin
3. Environment variables'ları Vercel dashboard'unda ekleyin:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `GMAIL_USER`
   - `GMAIL_PASSWORD`
   - `CRON_SECRET`
   - `GOOGLE_SHEETS_WEBHOOK_URL`

4. Deploy butonuna tıklayın

### Manuel Build

```bash
npm run build
npm run preview
```

## 🔒 Güvenlik

- Environment variables kullanılarak hassas bilgiler korunur
- Firebase Security Rules ile veri güvenliği sağlanır
- Vercel güvenlik başlıkları ile XSS ve diğer saldırılara karşı koruma
- HTTPS zorunlu kullanım

## 📱 Mobil Uyumluluk

Uygulama responsive tasarım ile tüm cihazlarda optimum kullanım deneyimi sunar:
- Mobil öncelikli tasarım
- Touch-friendly arayüz
- Hızlı yükleme süreleri

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için: [support@teknokapsul.com](mailto:support@teknokapsul.com)