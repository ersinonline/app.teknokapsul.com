const fs = require('fs');
const PDFDocument = require('pdfkit');

// Create a new PDF document
const doc = new PDFDocument();

// Pipe the PDF to a file
doc.pipe(fs.createWriteStream('test-bank-statement.pdf'));

// Add content that matches Turkish bank statement format
doc.fontSize(12)
   .text('Hesap Hareketleri', 50, 50)
   .text('Yapı ve Kredi Bankası A.Ş.', 50, 70)
   .text('Müşteri Adı Soyadı: ERSİN ÇELİK', 50, 100)
   .text('Hesap No: TR810006701000000021263077', 50, 120)
   .text('', 50, 140)
   .text('Tarih        Açıklama                    Tutar     Borç/Alacak', 50, 160)
   .text('------------------------------------------------------------------------', 50, 180)
   .text('15.10.2024   Market Alışverişi          -150,50   Borç', 50, 200)
   .text('16.10.2024   Maaş Ödemesi             +5.000,00  Alacak', 50, 220)
   .text('17.10.2024   ATM Para Çekme             -200,00   Borç', 50, 240)
   .text('18.10.2024   Fatura Ödemesi            -85,75    Borç', 50, 260)
   .text('19.10.2024   Havale Gelen              +1.250,00  Alacak', 50, 280);

// Finalize the PDF
doc.end();

console.log('Test PDF created: test-bank-statement.pdf');