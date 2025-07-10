"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testExpenseReminder = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
if (!admin.apps.length) {
    admin.initializeApp();
}
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().gmail.user,
        pass: functions.config().gmail.password
    }
});
exports.testExpenseReminder = functions.https.onRequest(async (req, res) => {
    console.log('Test expense reminder function started');
    const db = admin.firestore();
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);
    console.log(`Checking expenses between ${now.toISOString()} and ${threeDaysLater.toISOString()}`);
    try {
        // Tüm kullanıcıları al
        const usersSnapshot = await db.collection('teknokapsul').get();
        console.log(`Found ${usersSnapshot.docs.length} users`);
        let emailsSent = 0;
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
                    subject: 'Yaklaşan Gider Hatırlatması - Test',
                    html: `
            <h2>Merhaba ${userData.name},</h2>
            <p>Aşağıdaki giderlerin ödeme tarihi yaklaşıyor:</p>
            <ul>
              ${upcomingExpenses.map(expense => `<li>${expense.name} - ${expense.amount} TL (${expense.date})</li>`).join('')}
            </ul>
            <p>Teknokapsül uygulamasına giriş yaparak detayları görüntüleyebilirsiniz.</p>
            <p>Bu bir test emailidir.</p>
            <p>İyi günler dileriz.</p>
          `
                };
                // E-posta gönder
                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Email sent successfully to ${userData.email}`);
                    emailsSent++;
                }
                catch (error) {
                    console.error(`Failed to send email to ${userData.email}:`, error);
                }
            }
        }
        console.log('Test expense reminder function completed');
        res.json({
            success: true,
            message: `Test completed. ${emailsSent} emails sent.`,
            emailsSent: emailsSent
        });
    }
    catch (error) {
        console.error('Error in test function:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
//# sourceMappingURL=testReminder.js.map