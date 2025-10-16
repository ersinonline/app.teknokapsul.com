import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendExpenseReminder } from './email.service';

export interface ExpenseReminder {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Giderlerin ödeme tarihine 2 gün kala hatırlatma maili gönderir
 */
export const checkAndSendExpenseReminders = async (): Promise<void> => {
  try {
    // 2 gün sonraki tarihi hesapla
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    // Tüm kullanıcıları al (bu basit bir yaklaşım, gerçek uygulamada daha optimize edilebilir)
    const usersSnapshot = await getDocs(collection(db, 'teknokapsul'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Kullanıcının giderlerini al
      const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
      const expensesQuery = query(
        expensesRef,
        where('date', '>=', Timestamp.fromDate(twoDaysFromNow)),
        where('date', '<', Timestamp.fromDate(threeDaysFromNow))
      );
      
      const expensesSnapshot = await getDocs(expensesQuery);
      
      // Kullanıcı bilgilerini al
      const userData = userDoc.data();
      const userEmail = userData.email;
      const userName = userData.name || userData.fullName || 'Kullanıcı';
      
      if (!userEmail) {
        console.log(`User ${userId} has no email, skipping reminders`);
        continue;
      }
      
      // Her gider için hatırlatma maili gönder
      for (const expenseDoc of expensesSnapshot.docs) {
        const expense = expenseDoc.data();
        
        try {
          await sendExpenseReminder({
            to_email: userEmail,
            to_name: userName,
            expense_title: expense.title,
            expense_amount: `${expense.amount} TL`,
            expense_category: expense.category,
            expense_due_date: new Date(expense.date.toDate()).toLocaleDateString('tr-TR'),
            days_until_due: '2'
          });
          
          console.log(`Reminder sent for expense: ${expense.title} to ${userEmail}`);
        } catch (emailError) {
          console.error(`Failed to send reminder for expense ${expense.title}:`, emailError);
        }
      }
    }
  } catch (error) {
    console.error('Error checking and sending expense reminders:', error);
  }
};

/**
 * Belirli bir kullanıcının yaklaşan giderlerini kontrol eder ve hatırlatma gönderir
 */
export const checkUserExpenseReminders = async (userId: string, userEmail: string, userName: string): Promise<void> => {
  try {
    // 2 gün sonraki tarihi hesapla
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    // Kullanıcının yaklaşan giderlerini al
    const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
    const expensesQuery = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(twoDaysFromNow)),
      where('date', '<', Timestamp.fromDate(threeDaysFromNow))
    );
    
    const expensesSnapshot = await getDocs(expensesQuery);
    
    // Her gider için hatırlatma maili gönder
    for (const expenseDoc of expensesSnapshot.docs) {
      const expense = expenseDoc.data();
      
      try {
        await sendExpenseReminder({
          to_email: userEmail,
          to_name: userName,
          expense_title: expense.title,
          expense_amount: `${expense.amount} TL`,
          expense_category: expense.category,
          expense_due_date: new Date(expense.date.toDate()).toLocaleDateString('tr-TR'),
          days_until_due: '2'
        });
        
        console.log(`Reminder sent for expense: ${expense.title} to ${userEmail}`);
      } catch (emailError) {
        console.error(`Failed to send reminder for expense ${expense.title}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error checking user expense reminders:', error);
  }
};