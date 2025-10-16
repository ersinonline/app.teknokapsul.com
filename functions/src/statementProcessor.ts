import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    serviceAccountId: 'firebase-adminsdk-geoml@superapp-37db4.iam.gserviceaccount.com'
  });
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use pdfjs-dist for PDF text extraction
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      verbosity: 0
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw error;
  }
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    // Use Tesseract.js for OCR
    const Tesseract = require('tesseract.js');
    
    console.log('Starting OCR processing...');
    const { data: { text } } = await Tesseract.recognize(buffer, 'tur', {
      logger: (m: any) => console.log('OCR Progress:', m)
    });
    
    console.log('OCR completed, extracted text length:', text.length);
    return text;
  } catch (error) {
    console.error('Image OCR error:', error);
    throw error;
  }
}

function parseTRCurrencyToNumber(input: string): number {
  const s = input.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDateTR(d: string): number {
  // format: dd.mm.yyyy
  const [dd, mm, yyyy] = d.split('.').map((x) => parseInt(x, 10));
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  return date.getTime();
}

function detectType(line: string, amountStr: string): 'debit' | 'credit' {
  const l = line.toLowerCase();
  if (l.includes('borç') || l.includes('çıkış') || amountStr.trim().startsWith('-')) return 'debit';
  if (l.includes('alacak') || l.includes('giriş') || amountStr.trim().startsWith('+')) return 'credit';
  // Fallback: positive => credit, negative => debit
  return parseTRCurrencyToNumber(amountStr) >= 0 ? 'credit' : 'debit';
}

function extractTransactionsFromText(text: string) {
  const lines = text.split(/\r?\n/);
  const txs: Array<{
    date: number;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    currency?: string;
    raw?: any;
  }> = [];

  const amountRegex = /([+-]?\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|[+-]?\d+(?:\.\d{2})?)/;
  const dateRegex = /(\d{2}\.\d{2}\.\d{4})/;

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);
    if (!dateMatch || !amountMatch) continue;

    const dateStr = dateMatch[1];
    const amountStr = amountMatch[1];
    const date = parseDateTR(dateStr);
    const amount = parseTRCurrencyToNumber(amountStr);
    const type = detectType(line, amountStr);
    const desc = line
      .replace(dateStr, '')
      .replace(amountStr, '')
      .replace(/Borç|Alacak|Çıkış|Giriş/gi, '')
      .trim();

    txs.push({ date, description: desc || 'İşlem', amount: Math.abs(amount), type, currency: 'TRY', raw: { line } });
  }

  return txs;
}

export const processBankStatement = functions.storage.object().onFinalize(async (object) => {
  try {
    console.log('=== BANK STATEMENT PROCESSING START ===');
    console.log('Object details:', JSON.stringify(object, null, 2));
    
    const name = object.name || '';
    const contentType = object.contentType || '';
    console.log('File name:', name);
    console.log('Content type:', contentType);
    
    if (!name.startsWith('bank-statements/')) {
      console.log('File not in bank-statements folder, skipping:', name);
      return;
    }

    // Check if file is PDF or image
    const isPDF = contentType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
    const isImage = contentType.startsWith('image/') || 
                   name.toLowerCase().match(/\.(png|jpg|jpeg|gif|bmp|webp)$/);
    
    if (!isPDF && !isImage) {
      console.log('File is neither PDF nor image, skipping:', name, 'Content type:', contentType);
      return;
    }
    
    console.log('File type detected:', isPDF ? 'PDF' : 'Image');
    
    // Path: bank-statements/{userId}/{accountId}/{fileName}
    const parts = name.split('/');
    console.log('Path parts:', parts);
    
    if (parts.length < 4) {
      console.warn('Invalid statement path:', name);
      return;
    }
    const userId = parts[1];
    const accountId = parts[2];
    
    console.log(`Processing for user: ${userId}, account: ${accountId}`);
    console.log('Bucket name:', object.bucket);

    try {
      const bucket = admin.storage().bucket(object.bucket);
      console.log('Bucket initialized successfully');
      
      const file = bucket.file(name);
      console.log('File reference created');
      
      console.log('Starting file download...');
      const [buf] = await file.download();
      console.log('File download completed successfully');
      
      console.log(`Downloaded file, size: ${buf.length} bytes`);
      
      // Extract text based on file type
      let text: string;
      if (isPDF) {
        console.log('Processing as PDF...');
        text = await extractTextFromPDF(buf);
      } else {
        console.log('Processing as image with OCR...');
        text = await extractTextFromImage(buf);
      }
      
      console.log(`Extracted text length: ${text.length} characters`);
      console.log(`First 500 characters:`, text.substring(0, 500));
      console.log(`Full text:`, text);

      const txs = extractTransactionsFromText(text);
      console.log(`Found ${txs.length} transactions`);
      if (txs.length > 0) {
        console.log(`Sample transactions:`, txs.slice(0, 3));
      }

      const db = admin.firestore();
      const col = db.collection('teknokapsul').doc(userId).collection('bankTransactions');
      const batch = db.batch();
      const createdAt = Date.now();

      for (const t of txs) {
        // Deterministic id: accountId|date|amount|description|type
        const key = [accountId, t.date, t.amount, (t.description || '').trim(), t.type].join('|');
        // Simple hash
        let h = 2166136261;
        for (let i = 0; i < key.length; i++) {
          h ^= key.charCodeAt(i);
          h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
        }
        const id = 't_' + (h >>> 0).toString(16);

        const ref = col.doc(id);
        batch.set(ref, {
          id,
          userId,
          accountId,
          date: t.date,
          amount: t.amount,
          currency: t.currency || 'TRY',
          type: t.type,
          description: t.description,
          source: 'bank-pdf',
          raw: t.raw,
          createdAt,
        }, { merge: true });
      }

      await batch.commit();
      console.log(`Successfully processed ${txs.length} transactions for ${userId}/${accountId}`);
      return;
    } catch (downloadError) {
      console.error('File download/processing error:', downloadError);
      throw downloadError;
    }
  } catch (err) {
    console.error('Statement processing error:', err);
    throw err; // Re-throw to see the error in logs
  }
});