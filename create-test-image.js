import { createCanvas } from 'canvas';
import fs from 'fs';

// Create a canvas with bank statement content
const width = 800;
const height = 600;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Set background to white
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, width, height);

// Set text properties
ctx.fillStyle = 'black';
ctx.font = '16px Arial';

// Add bank statement content
const lines = [
  'YAPI KREDİ BANKASI A.Ş.',
  'HESAP HAREKETLERİ',
  '',
  'Müşteri: ERSİN ÇELİK',
  'Hesap No: TR810006701000000021263077',
  'Tarih Aralığı: 01.10.2024 - 31.10.2024',
  '',
  'TARİH        AÇIKLAMA                    TUTAR      BORÇ/ALACAK',
  '─────────────────────────────────────────────────────────────',
  '15.10.2024   Market Alışverişi          150,50 TL   Borç',
  '16.10.2024   Maaş Ödemesi             5.000,00 TL   Alacak',
  '17.10.2024   ATM Para Çekme             200,00 TL   Borç',
  '18.10.2024   Fatura Ödemesi             85,75 TL   Borç',
  '19.10.2024   Havale Gelen             1.250,00 TL   Alacak',
  '20.10.2024   Online Alışveriş           75,25 TL   Borç',
  '21.10.2024   Kira Ödemesi             2.500,00 TL   Borç',
  '',
  'Toplam Giren: 6.250,00 TL',
  'Toplam Çıkan: 3.011,50 TL',
  'Bakiye: 3.238,50 TL'
];

// Draw each line
let y = 50;
lines.forEach(line => {
  ctx.fillText(line, 50, y);
  y += 25;
});

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test-bank-statement.png', buffer);

console.log('Test PNG image created: test-bank-statement.png');