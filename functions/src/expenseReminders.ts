import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.user,
    pass: functions.config().gmail.password
  }
});

export const checkExpenseReminders = functions.pubsub
  .schedule('every day 16:34')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('teknokapsul').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Kullanıcının giderlerini sorgula
      const expensesRef = db.collection('teknokapsul').doc(userId).collection('expenses');
      const querySnapshot = await expensesRef
        .where('date', '>=', now.toISOString())
        .where('date', '<=', threeDaysLater.toISOString())
        .where('isActive', '==', true)
        .where('isPaid', '==', false)
        .get();

      if (!querySnapshot.empty) {
        // Hatırlatılacak giderleri topla
        const upcomingExpenses = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name,
            amount: data.amount,
            date: new Date(data.date).toLocaleDateString('tr-TR'),
            category: data.category
          };
        });

        // E-posta içeriği oluştur
        const mailOptions = {
          from: 'Teknokapsül <noreply@teknokapsul.com>',
          to: userData.email,
          subject: 'Yaklaşan Gider Hatırlatması',
          html: `
            <h2>Merhaba ${userData.name},</h2>
            <p>Aşağıdaki giderlerin ödeme tarihi yaklaşıyor:</p>
            <ul>
              ${upcomingExpenses.map(expense => 
                `<li>${expense.name} - ${expense.amount} TL (${expense.date})</li>`
              ).join('')}
            </ul>
            <p>Teknokapsül uygulamasına giriş yaparak detayları görüntüleyebilirsiniz.</p>
            <p>İyi günler dileriz.</p>
          `
        };

        // E-posta gönder
        await transporter.sendMail(mailOptions);
      }
    }
    
    return null;
  });