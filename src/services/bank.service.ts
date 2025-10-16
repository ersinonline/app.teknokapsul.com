import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import type { BankAccount, BankTransaction } from "../types/bank";

function now() {
  return Date.now();
}

export async function createBankAccount(userId: string, data: Partial<BankAccount>) {
  const account: BankAccount = {
    id: "",
    userId,
    bankName: data.bankName || "",
    accountName: data.accountName || "",
    iban: data.iban || "",
    accountNumber: data.accountNumber || "",
    currency: data.currency || "TRY",
    createdAt: now(),
    updatedAt: now(),
  };
  const col = collection(db, "teknokapsul", userId, "bankAccounts");
  const created = await addDoc(col, account);
  await setDoc(created, { ...account, id: created.id }, { merge: true });
  return { ...account, id: created.id };
}

export async function getBankAccounts(userId: string) {
  const col = collection(db, "teknokapsul", userId, "bankAccounts");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data()) as BankAccount[];
}

export async function getTransactions(userId: string, accountId: string) {
  const col = collection(db, "teknokapsul", userId, "bankTransactions");
  const q = query(col, where("accountId", "==", accountId), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data()) as BankTransaction[];
}

// Deterministic transaction id for deduplication: accountId|date|amount|description|type
export function makeTransactionId(t: Pick<BankTransaction, "accountId" | "date" | "amount" | "description" | "type">) {
  const key = [t.accountId, t.date, t.amount, (t.description || "").trim(), t.type].join("|");
  // Simple FNV-1a hash for stable, short id
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return "t_" + (h >>> 0).toString(16);
}

export async function saveTransactions(userId: string, accountId: string, txs: Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[]) {
  const batch = writeBatch(db);
  const col = collection(db, "teknokapsul", userId, "bankTransactions");
  const createdAt = now();
  for (const t of txs) {
    const id = makeTransactionId({
      accountId,
      date: t.date,
      amount: t.amount,
      description: t.description,
      type: t.type,
    });
    const refDoc = doc(col, id);
    const payload: BankTransaction = {
      id,
      userId,
      accountId,
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      type: t.type,
      description: t.description,
      balanceAfter: t.balanceAfter,
      source: t.source,
      raw: t.raw,
      createdAt,
    };
    // Idempotent: writing same id overwrites; dedup is enforced by deterministic id
    batch.set(refDoc, payload, { merge: true });
  }
  await batch.commit();
}

export function parseTransactionText(text: string, bankType: 'yapikredi' | 'garanti' | 'akbank' | 'teb' = 'yapikredi'): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] {
  if (bankType === 'garanti') {
    return parseGarantiTransactionText(text);
  }
  if (bankType === 'akbank') {
    return parseAkbankTransactionText(text);
  }
  if (bankType === 'teb') {
    return parseTebTransactionText(text);
  }
  return parseYapiKrediTransactionText(text);
}

function parseYapiKrediTransactionText(text: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] {
  // Normalize line breaks and clean up the text
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const transactions: Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] = [];
  
  let currentTransaction = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a new transaction (has date pattern)
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}/;
    
    if (datePattern.test(line)) {
      // Process previous transaction if exists
      if (currentTransaction) {
        const parsed = parseYapiKrediTransactionLine(currentTransaction);
        if (parsed) {
          transactions.push(parsed);
        }
      }
      // Start new transaction
      currentTransaction = line;
    } else {
      // This is a continuation of the current transaction
      if (currentTransaction) {
        currentTransaction += ' ' + line;
      }
    }
  }
  
  // Process the last transaction
  if (currentTransaction) {
    const parsed = parseYapiKrediTransactionLine(currentTransaction);
    if (parsed) {
      transactions.push(parsed);
    }
  }
  
  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => b.date - a.date);
}

function parseAkbankTransactionText(text: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] {
  // Normalize line breaks and clean up the text
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const transactions: Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] = [];
  
  for (const line of lines) {
    // Skip header lines
    if (line.includes('Tarih') && line.includes('Tutar') && line.includes('Bakiye') && line.includes('Açıklama')) {
      continue;
    }
    
    const parsed = parseAkbankTransactionLine(line);
    if (parsed) {
      transactions.push(parsed);
    }
  }
  
  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => b.date - a.date);
}

function parseTebTransactionText(text: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] {
  const transactions: Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] = [];
  
  // Normalize line endings and split into lines
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  // Filter out header lines and empty lines
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.includes('Türk Ekonomi Bankası') &&
           !trimmed.includes('Sıra No') &&
           !trimmed.includes('Tarih') &&
           !trimmed.includes('Açıklama') &&
           !trimmed.includes('İşlem Tutarı') &&
           !trimmed.includes('Bakiye') &&
           !trimmed.includes('Rev.No') &&
           !trimmed.includes('www.teb.com.tr') &&
           !trimmed.includes('Mersis:') &&
           !trimmed.includes('Ticaret Sicil:') &&
           !trimmed.includes('İnkılap Mah.') &&
           !trimmed.includes('/ 8');
  });

  // Combine multiline descriptions
  const combinedLines: string[] = [];
  let currentLine = '';
  
  for (const line of filteredLines) {
    const trimmed = line.trim();
    
    // Check if this line starts with a sequence number (new transaction)
    const startsWithSeqNumber = /^\d+\s+\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed);
    
    if (startsWithSeqNumber) {
      // If we have a current line, save it
      if (currentLine) {
        combinedLines.push(currentLine);
      }
      // Start new line
      currentLine = trimmed;
    } else {
      // This is a continuation line, append to current
      if (currentLine) {
        currentLine += ' ' + trimmed;
      }
    }
  }
  
  // Don't forget the last line
  if (currentLine) {
    combinedLines.push(currentLine);
  }

  for (const line of combinedLines) {
    const transaction = parseTebTransactionLine(line);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  // Sort by date (oldest first)
  return transactions.sort((a, b) => a.date - b.date);
}

function parseGarantiTransactionText(text: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] {
  // Normalize line breaks and clean up the text
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const transactions: Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt">[] = [];
  
  for (const line of lines) {
    // Skip header lines
    if (line.includes('Tarih') && line.includes('Açıklama') && line.includes('Tutar')) {
      continue;
    }
    
    const parsed = parseGarantiTransactionLine(line);
    if (parsed) {
      transactions.push(parsed);
    }
  }
  
  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => b.date - a.date);
}

function parseYapiKrediTransactionLine(line: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt"> | null {
  try {
    // Parse format: 11/10/2025 00:41:07 Para Gönder Diğer GELEN FAST - ERSİN ÇELİK - . 750,00 TL 750,00 TL
    const trimmedLine = line.trim();
    
    // Extract date and time using regex
    const dateTimeMatch = trimmedLine.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})/);
    if (!dateTimeMatch) return null;
    
    const dateStr = dateTimeMatch[1]; // 11/10/2025
    const timeStr = dateTimeMatch[2]; // 00:41:07
    const [day, month, year] = dateStr.split('/');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeStr}`).getTime();
    
    // Remove date and time from the line to get the rest
    const restOfLine = trimmedLine.substring(dateTimeMatch[0].length).trim();
    
    // Find all TL amounts using regex
    const tlMatches = restOfLine.match(/[-+]?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*TL/g);
    
    if (!tlMatches || tlMatches.length === 0) return null;
    
    // The last TL amount is usually the balance, the second-to-last is the transaction amount
    let amountStr = '';
    let balanceStr = '';
    
    if (tlMatches.length >= 2) {
      amountStr = tlMatches[tlMatches.length - 2];
      balanceStr = tlMatches[tlMatches.length - 1];
    } else {
      amountStr = tlMatches[0];
      balanceStr = '0,00 TL';
    }
    
    // Parse amount
    const amountMatch = amountStr.match(/[-+]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    if (!amountMatch) return null;
    
    const isNegative = amountStr.includes('-');
    const cleanAmount = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount)) return null;
    
    // Parse balance
    const balanceMatch = balanceStr.match(/[-+]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    const balanceAfter = balanceMatch ? parseFloat(balanceMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
    
    // Extract description (everything before the first TL amount)
    const firstTlIndex = restOfLine.indexOf(tlMatches[0]);
    const description = restOfLine.substring(0, firstTlIndex).trim();
    
    return {
      date,
      amount: isNegative ? -amount : amount,
      currency: 'TRY',
      type: isNegative ? 'debit' : 'credit',
      description,
      balanceAfter: isNaN(balanceAfter) ? 0 : balanceAfter,
      source: 'manual',
      raw: { originalLine: line }
    };
  } catch (error) {
    console.warn('Failed to parse Yapı Kredi transaction line:', line, error);
    return null;
  }
}

function parseGarantiTransactionLine(line: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt"> | null {
  try {
    // Parse Garanti format: 16.10.2025 K.Kartı Ödeme 5499 **** **** 0015 Kart Ödemesi -79,52 TL 0,00 TL
    const trimmedLine = line.trim();
    
    // Extract date using regex (DD.MM.YYYY format)
    const dateMatch = trimmedLine.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!dateMatch) return null;
    
    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3];
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).getTime();
    
    // Remove date from the line to get the rest
    const restOfLine = trimmedLine.substring(dateMatch[0].length).trim();
    
    // Find all TL amounts using regex
    const tlMatches = restOfLine.match(/[-+]?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*TL/g);
    
    if (!tlMatches || tlMatches.length === 0) return null;
    
    // The last TL amount is usually the balance, the second-to-last is the transaction amount
    let amountStr = '';
    let balanceStr = '';
    
    if (tlMatches.length >= 2) {
      amountStr = tlMatches[tlMatches.length - 2];
      balanceStr = tlMatches[tlMatches.length - 1];
    } else {
      amountStr = tlMatches[0];
      balanceStr = '0,00 TL';
    }
    
    // Parse amount
    const amountMatch = amountStr.match(/[-+]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    if (!amountMatch) return null;
    
    const isNegative = amountStr.includes('-');
    const cleanAmount = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount)) return null;
    
    // Parse balance
    const balanceMatch = balanceStr.match(/[-+]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
    const balanceAfter = balanceMatch ? parseFloat(balanceMatch[1].replace(/\./g, '').replace(',', '.')) : 0;
    
    // Extract description (everything before the first TL amount)
    const firstTlIndex = restOfLine.indexOf(tlMatches[0]);
    const description = restOfLine.substring(0, firstTlIndex).trim();
    
    return {
      date,
      amount: isNegative ? -amount : amount,
      currency: 'TRY',
      type: isNegative ? 'debit' : 'credit',
      description,
      balanceAfter: isNaN(balanceAfter) ? 0 : balanceAfter,
      source: 'manual',
      raw: { originalLine: line }
    };
  } catch (error) {
    console.warn('Failed to parse Garanti transaction line:', line, error);
    return null;
  }
}

function parseAkbankTransactionLine(line: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt"> | null {
  try {
    // Parse Akbank format: 2025-10-16-10.24.14.236789 	 23,77 TL 	 23,77 TL 	 Google Payment Corp. - Cıtıbank A.s.
    const trimmedLine = line.trim();
    
    // Split by tabs or multiple spaces
    const parts = trimmedLine.split(/\t+|\s{2,}/).filter(part => part.trim().length > 0);
    
    if (parts.length < 4) return null;
    
    // Extract date (first part)
    const dateStr = parts[0]; // 2025-10-16-10.24.14.236789
    
    // Parse the date format: YYYY-MM-DD-HH.MM.SS.microseconds
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/);
    if (!dateMatch) return null;
    
    const [, year, month, day, hour, minute, second] = dateMatch;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).getTime();
    
    // Extract amount (second part)
    const amountStr = parts[1]; // 23,77 TL or -100.000,00 TL
    const amountMatch = amountStr.match(/^([+-]?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*TL$/);
    if (!amountMatch) return null;
    
    const sign = amountMatch[1];
    const numberStr = amountMatch[2];
    
    // Convert Turkish number format to standard format
    const amount = parseFloat(numberStr.replace(/\./g, '').replace(',', '.'));
    const isNegative = sign === '-' || amount < 0;
    
    // Extract balance (third part)
    const balanceStr = parts[2]; // 23,77 TL
    const balanceMatch = balanceStr.match(/^(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*TL$/);
    let balanceAfter = 0;
    if (balanceMatch) {
      balanceAfter = parseFloat(balanceMatch[1].replace(/\./g, '').replace(',', '.'));
    }
    
    // Extract description (fourth part and beyond)
    const description = parts.slice(3).join(' ').trim();
    
    return {
      date,
      amount: Math.abs(amount),
      type: isNegative ? 'debit' : 'credit',
      description: description || 'İşlem',
      balanceAfter,
      currency: 'TRY',
      source: 'akbank-text',
      raw: { line: trimmedLine }
    };
  } catch (error) {
    console.warn('Failed to parse Akbank transaction line:', line, error);
    return null;
  }
}

function parseTebTransactionLine(line: string): Omit<BankTransaction, "id" | "userId" | "accountId" | "createdAt"> | null {
  try {
    // Parse TEB format: 96 16/10/2025 HAYHAY ELEKTRONİK PARA VE ÖDEME HİZMETLERİ ANONİM ŞİRKETİ de 561,36 468.419,78
    const trimmedLine = line.trim();
    
    // Split by spaces and handle multiple spaces
    const parts = trimmedLine.split(/\s+/);
    
    if (parts.length < 5) return null; // At least: seq, date, description, amount, balance
    
    // Skip the first part (sequence number) and extract date (second part)
    const dateStr = parts[1]; // 16/10/2025
    
    // Parse the date format: DD/MM/YYYY
    const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dateMatch) return null;
    
    const [, day, month, year] = dateMatch;
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).getTime();
    
    // Find amount and balance - they are the last two numeric values
    let amountStr = '';
    let balanceStr = '';
    let amountIndex = -1;
    let balanceIndex = -1;
    
    // Work backwards from the end to find balance and amount
    // Look for proper Turkish number format: digits with optional dots for thousands and comma for decimals
    for (let i = parts.length - 1; i >= 2; i--) {
      const part = parts[i];
      // Turkish number format: can be negative, has digits, optional dots for thousands, comma for decimals
      // Examples: 561,36  468.419,78  -160.986,84
      if (/^-?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(part)) {
        if (balanceIndex === -1) {
          balanceStr = part; // Last number is balance
          balanceIndex = i;
        } else if (amountIndex === -1) {
          amountStr = part; // Second to last number is amount
          amountIndex = i;
          break;
        }
      }
    }
    
    if (!amountStr || !balanceStr || amountIndex === -1) {
      console.warn('Could not find amount and balance in TEB line:', trimmedLine);
      console.warn('Parts:', parts);
      console.warn('Found amount:', amountStr, 'at index:', amountIndex);
      console.warn('Found balance:', balanceStr, 'at index:', balanceIndex);
      return null;
    }
    
    // Description is everything between date and amount
    const descriptionParts = parts.slice(2, amountIndex);
    
    // Convert Turkish number format to standard format
    const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    const balanceAfter = parseFloat(balanceStr.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(amount) || isNaN(balanceAfter)) {
      console.warn('Invalid numbers in TEB line:', { amountStr, balanceStr, amount, balanceAfter });
      return null;
    }
    
    const isNegative = amount < 0;
    
    // Join description parts and clean up
    const description = descriptionParts.join(' ').trim() || 'İşlem';
    
    return {
      date,
      amount: Math.abs(amount),
      type: isNegative ? 'debit' : 'credit',
      description,
      balanceAfter,
      currency: 'TRY',
      source: 'teb-text',
      raw: { line: trimmedLine }
    };
  } catch (error) {
    console.warn('Failed to parse TEB transaction line:', line, error);
    return null;
  }
}

export async function addTransactionsFromText(userId: string, accountId: string, text: string, bankType: 'yapikredi' | 'garanti' | 'akbank' | 'teb' = 'yapikredi') {
  const transactions = parseTransactionText(text, bankType);
  if (transactions.length > 0) {
    await saveTransactions(userId, accountId, transactions);
  }
  return transactions;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const docRef = doc(db, "teknokapsul", userId, "bankTransactions", transactionId);
  await deleteDoc(docRef);
}

export async function updateBankAccount(userId: string, accountId: string, data: Partial<BankAccount>) {
  const docRef = doc(db, "teknokapsul", userId, "bankAccounts", accountId);
  const updateData = {
    ...data,
    updatedAt: now(),
  };
  await updateDoc(docRef, updateData);
  return updateData;
}

export async function deleteBankAccount(userId: string, accountId: string) {
  const docRef = doc(db, "teknokapsul", userId, "bankAccounts", accountId);
  await deleteDoc(docRef);
  
  // İlgili işlemleri de sil
  const transactionsCol = collection(db, "teknokapsul", userId, "bankTransactions");
  const q = query(transactionsCol, where("accountId", "==", accountId));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export function validateIban(iban: string): boolean {
  // IBAN formatını kontrol et: TR ile başlamalı ve 26 karakter olmalı (TR + 24 rakam)
  const ibanRegex = /^TR\d{24}$/;
  return ibanRegex.test(iban.replace(/\s/g, ''));
}

export function formatAccountNumber(iban: string): string {
  // IBAN'ın son 8 hanesini hesap numarası olarak döndür
  const cleanIban = iban.replace(/\s/g, '');
  if (cleanIban.length >= 8) {
    return cleanIban.slice(-8);
  }
  return cleanIban;
}