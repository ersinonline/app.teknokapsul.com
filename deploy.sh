#!/bin/bash

# TeknokapsulApp Deployment Script
# Bu script projeyi Vercel'e deploy etmek için gerekli adımları içerir

echo "🚀 TeknokapsulApp Deployment başlatılıyor..."

# Environment variables kontrolü
echo "📋 Environment variables kontrol ediliyor..."
if [ ! -f ".env" ]; then
    echo "❌ .env dosyası bulunamadı!"
    echo "💡 .env.example dosyasını kopyalayıp .env olarak kaydedin ve Firebase yapılandırmanızı ekleyin."
    exit 1
fi

# Node modules kontrolü
echo "📦 Dependencies kontrol ediliyor..."
if [ ! -d "node_modules" ]; then
    echo "📥 Dependencies yükleniyor..."
    npm install
fi

# Lint kontrolü
echo "🔍 Code quality kontrol ediliyor..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint hataları bulundu! Lütfen düzeltin ve tekrar deneyin."
    exit 1
fi

# Build işlemi
echo "🔨 Proje build ediliyor..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build işlemi başarısız!"
    exit 1
fi

# Firebase Security Rules deploy (opsiyonel)
echo "🔒 Firebase Security Rules deploy ediliyor..."
if command -v firebase &> /dev/null; then
    firebase deploy --only firestore:rules,storage:rules
    if [ $? -eq 0 ]; then
        echo "✅ Firebase Security Rules başarıyla deploy edildi!"
    else
        echo "⚠️  Firebase Security Rules deploy edilemedi. Manuel olarak deploy edin."
    fi
else
    echo "⚠️  Firebase CLI bulunamadı. Security rules'ları manuel olarak deploy edin."
fi

# Vercel deploy
echo "🌐 Vercel'e deploy ediliyor..."
if command -v vercel &> /dev/null; then
    vercel --prod
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment başarıyla tamamlandı!"
        echo "🔗 Uygulamanız artık canlıda!"
    else
        echo "❌ Vercel deployment başarısız!"
        exit 1
    fi
else
    echo "❌ Vercel CLI bulunamadı!"
    echo "💡 'npm install -g vercel' komutu ile Vercel CLI'yi yükleyin."
    exit 1
fi

echo "✨ Deployment tamamlandı!"
echo "📝 Deployment sonrası kontrol listesi:"
echo "   - Vercel dashboard'unda environment variables'ları kontrol edin"
echo "   - Firebase Console'da Security Rules'ları kontrol edin"
echo "   - Uygulamanın düzgün çalıştığını test edin"