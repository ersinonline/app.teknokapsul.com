"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpenseReminders = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().gmail.user,
        pass: functions.config().gmail.password
    }
});
exports.checkExpenseReminders = functions.scheduler
    .onSchedule('0 9 * * *', async (context) => {
    console.log('Expense reminder function started');
    const db = admin.firestore();
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);
    console.log(`Checking expenses between ${now.toISOString()} and ${threeDaysLater.toISOString()}`);
    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('teknokapsul').get();
    console.log(`Found ${usersSnapshot.docs.length} users`);
    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        if (!userData.email) {
            console.log(`User ${userId} has no email address`);
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
        console.log(`User ${userId} has ${querySnapshot.docs.length} upcoming expenses`);
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
              ${upcomingExpenses.map(expense => `<li>${expense.name} - ${expense.amount} TL (${expense.date})</li>`).join('')}
            </ul>
            <p>Teknokapsül uygulamasına giriş yaparak detayları görüntüleyebilirsiniz.</p>
            <p>İyi günler dileriz.</p>
          `
            };
            // E-posta gönder
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${userData.email}`);
            }
            catch (error) {
                console.error(`Failed to send email to ${userData.email}:`, error);
            }
        }
    }
    console.log('Expense reminder function completed');
    return null;
});
//# sourceMappingURL=expenseReminders.js.map