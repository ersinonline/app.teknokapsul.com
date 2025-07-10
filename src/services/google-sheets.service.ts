import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK'yı başlat
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export interface ExpenseReminderData {
  userId: string;
  userName: string;
  userEmail: string;
  expenseName: string;
  expenseAmount: number;
  expenseDate: string;
  expenseCategory: string;
  daysUntilDue: number;
  reminderDate: string;
}

/**
 * Yaklaşan giderleri Google Sheets'e aktarmak için veri hazırlar
 * Bu fonksiyon Firebase'den verileri çeker ve Google Sheets formatında döndürür
 */
export async function getUpcomingExpensesForSheets(): Promise<ExpenseReminderData[]> {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    console.log(`Checking expenses between ${now.toISOString()} and ${threeDaysLater.toISOString()}`);

    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('teknokapsul').get();
    const expenseReminders: ExpenseReminderData[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      if (!userData.email) {
        continue;
      }

      // Kullanıcının giderlerini sorgula
      const expensesRef = db.collection('teknokapsul').doc(userId).collection('expenses');
      const querySnapshot = await expensesRef
        .where('date', '>=', now.toISOString().split('T')[0])
        .where('date', '<=', threeDaysLater.toISOString().split('T')[0])
        .where('isActive', '==', true)
        .where('isPaid', '==', false)
        .get();

      if (!querySnapshot.empty) {
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const expenseDate = new Date(data.date);
          const daysUntilDue = Math.ceil((expenseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          expenseReminders.push({
            userId,
            userName: userData.name || 'Kullanıcı',
            userEmail: userData.email,
            expenseName: data.name,
            expenseAmount: data.amount || 0,
            expenseDate: expenseDate.toLocaleDateString('tr-TR'),
            expenseCategory: data.category || 'Genel',
            daysUntilDue,
            reminderDate: now.toISOString().split('T')[0]
          });
        });
      }
    }

    console.log(`Found ${expenseReminders.length} upcoming expenses`);
    return expenseReminders;

  } catch (error) {
    console.error('Error fetching upcoming expenses:', error);
    throw error;
  }
}

/**
 * Google Sheets'e veri göndermek için CSV formatında string döndürür
 */
export function formatExpensesForCSV(expenses: ExpenseReminderData[]): string {
  const headers = [
    'Kullanıcı ID',
    'Kullanıcı Adı',
    'Email',
    'Gider Adı',
    'Tutar (TL)',
    'Ödeme Tarihi',
    'Kategori',
    'Kalan Gün',
    'Hatırlatma Tarihi'
  ];

  const rows = expenses.map(expense => [
    expense.userId,
    expense.userName,
    expense.userEmail,
    expense.expenseName,
    expense.expenseAmount.toString(),
    expense.expenseDate,
    expense.expenseCategory,
    expense.daysUntilDue.toString(),
    expense.reminderDate
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Google Apps Script için webhook URL'sine veri gönderir
 * Bu fonksiyon Google Sheets'e otomatik veri aktarımı için kullanılır
 */
export async function sendToGoogleSheets(webhookUrl: string): Promise<boolean> {
  try {
    const expenses = await getUpcomingExpensesForSheets();
    
    if (expenses.length === 0) {
      console.log('No upcoming expenses found');
      return true;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        totalExpenses: expenses.length,
        expenses: expenses
      })
    });

    if (response.ok) {
      console.log(`Successfully sent ${expenses.length} expenses to Google Sheets`);
      return true;
    } else {
      console.error('Failed to send data to Google Sheets:', response.statusText);
      return false;
    }

  } catch (error) {
    console.error('Error sending data to Google Sheets:', error);
    return false;
  }
}