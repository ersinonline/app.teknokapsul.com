"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpenseRemindersManual = exports.checkExpenseReminders = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const emailService_1 = require("./emailService");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Tüm kullanıcıların 2 gün sonra vadesi gelen giderlerini kontrol eder ve hatırlatma gönderir
 */
exports.checkExpenseReminders = functions.pubsub
    .schedule('0 9 * * *') // Her gün saat 09:00'da çalışır
    .timeZone('Europe/Istanbul')
    .onRun(async (context) => {
    console.log('Expense reminder check started at:', new Date().toISOString());
    try {
        // 2 gün sonraki tarihi hesapla
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        twoDaysFromNow.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(0, 0, 0, 0);
        console.log('Checking expenses due between:', twoDaysFromNow.toISOString(), 'and', threeDaysFromNow.toISOString());
        // Tüm kullanıcıları al (teknokapsul collection'ından)
        const usersSnapshot = await db.collection('teknokapsul').listDocuments();
        console.log('Found users:', usersSnapshot.length);
        let totalReminders = 0;
        let successfulReminders = 0;
        let failedReminders = 0;
        // Her kullanıcı için kontrol yap
        for (const userDoc of usersSnapshot) {
            const userId = userDoc.id;
            try {
                // Kullanıcının email bilgisini al (Clerk'ten veya başka bir yerden)
                // Bu örnekte, kullanıcı bilgilerinin users collection'ında olduğunu varsayıyoruz
                const userProfileDoc = await db.collection('users').doc(userId).get();
                if (!userProfileDoc.exists) {
                    console.log(`User profile not found for userId: ${userId}`);
                    continue;
                }
                const userProfile = userProfileDoc.data();
                const userEmail = userProfile === null || userProfile === void 0 ? void 0 : userProfile.email;
                const userName = (userProfile === null || userProfile === void 0 ? void 0 : userProfile.displayName) || (userProfile === null || userProfile === void 0 ? void 0 : userProfile.firstName) || 'Kullanıcı';
                if (!userEmail) {
                    console.log(`Email not found for userId: ${userId}`);
                    continue;
                }
                // Kullanıcının 2 gün sonra vadesi gelen giderlerini al
                const expensesRef = db.collection('teknokapsul').doc(userId).collection('expenses');
                const expensesQuery = expensesRef
                    .where('date', '>=', admin.firestore.Timestamp.fromDate(twoDaysFromNow))
                    .where('date', '<', admin.firestore.Timestamp.fromDate(threeDaysFromNow))
                    .where('isActive', '==', true)
                    .where('isPaid', '==', false);
                const expensesSnapshot = await expensesQuery.get();
                if (expensesSnapshot.empty) {
                    console.log(`No upcoming expenses for userId: ${userId}`);
                    continue;
                }
                console.log(`Found ${expensesSnapshot.size} upcoming expenses for userId: ${userId}`);
                // Her gider için hatırlatma maili gönder
                for (const expenseDoc of expensesSnapshot.docs) {
                    const expense = expenseDoc.data();
                    totalReminders++;
                    try {
                        const reminderData = {
                            to_email: userEmail,
                            to_name: userName,
                            expense_title: expense.title,
                            expense_amount: `${expense.amount} TL`,
                            expense_category: expense.category,
                            expense_due_date: expense.date.toDate().toLocaleDateString('tr-TR'),
                            days_until_due: '2'
                        };
                        await (0, emailService_1.sendExpenseReminder)(reminderData);
                        successfulReminders++;
                        console.log(`Reminder sent successfully for expense: ${expense.title} to ${userEmail}`);
                    }
                    catch (emailError) {
                        failedReminders++;
                        console.error(`Failed to send reminder for expense: ${expense.title} to ${userEmail}`, emailError);
                    }
                }
            }
            catch (userError) {
                console.error(`Error processing user ${userId}:`, userError);
            }
        }
        console.log(`Expense reminder check completed. Total: ${totalReminders}, Successful: ${successfulReminders}, Failed: ${failedReminders}`);
        return {
            success: true,
            totalReminders,
            successfulReminders,
            failedReminders,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error in expense reminder check:', error);
        throw new functions.https.HttpsError('internal', 'Expense reminder check failed');
    }
});
/**
 * Manuel olarak gider hatırlatmalarını kontrol etmek için HTTP endpoint
 */
exports.checkExpenseRemindersManual = functions.https.onCall(async (data, context) => {
    // Sadece admin kullanıcılar bu fonksiyonu çağırabilir
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Admin kontrolü (isteğe bağlı)
    const adminEmail = 'clk.ersinnn@gmail.com';
    if (context.auth.token.email !== adminEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    try {
        console.log('Manual expense reminder check started by:', context.auth.token.email);
        // Aynı logic'i kullan
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        twoDaysFromNow.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(0, 0, 0, 0);
        console.log('Manual check - expenses due between:', twoDaysFromNow.toISOString(), 'and', threeDaysFromNow.toISOString());
        // Tüm kullanıcıları al
        const usersSnapshot = await db.collection('teknokapsul').listDocuments();
        console.log('Manual check - found users:', usersSnapshot.length);
        let totalReminders = 0;
        let successfulReminders = 0;
        let failedReminders = 0;
        // Her kullanıcı için kontrol yap
        for (const userDoc of usersSnapshot) {
            const userId = userDoc.id;
            try {
                // Kullanıcının email bilgisini al
                const userProfileDoc = await db.collection('users').doc(userId).get();
                if (!userProfileDoc.exists) {
                    console.log(`Manual check - user profile not found for userId: ${userId}`);
                    continue;
                }
                const userProfile = userProfileDoc.data();
                const userEmail = userProfile === null || userProfile === void 0 ? void 0 : userProfile.email;
                const userName = (userProfile === null || userProfile === void 0 ? void 0 : userProfile.displayName) || (userProfile === null || userProfile === void 0 ? void 0 : userProfile.firstName) || 'Kullanıcı';
                if (!userEmail) {
                    console.log(`Manual check - email not found for userId: ${userId}`);
                    continue;
                }
                // Kullanıcının 2 gün sonra vadesi gelen giderlerini al
                const expensesRef = db.collection('teknokapsul').doc(userId).collection('expenses');
                const expensesQuery = expensesRef
                    .where('date', '>=', admin.firestore.Timestamp.fromDate(twoDaysFromNow))
                    .where('date', '<', admin.firestore.Timestamp.fromDate(threeDaysFromNow))
                    .where('isActive', '==', true)
                    .where('isPaid', '==', false);
                const expensesSnapshot = await expensesQuery.get();
                if (expensesSnapshot.empty) {
                    console.log(`Manual check - no upcoming expenses for userId: ${userId}`);
                    continue;
                }
                console.log(`Manual check - found ${expensesSnapshot.size} upcoming expenses for userId: ${userId}`);
                // Her gider için hatırlatma maili gönder
                for (const expenseDoc of expensesSnapshot.docs) {
                    const expense = expenseDoc.data();
                    totalReminders++;
                    try {
                        const reminderData = {
                            to_email: userEmail,
                            to_name: userName,
                            expense_title: expense.title,
                            expense_amount: `${expense.amount} TL`,
                            expense_category: expense.category,
                            expense_due_date: expense.date.toDate().toLocaleDateString('tr-TR'),
                            days_until_due: '2'
                        };
                        await (0, emailService_1.sendExpenseReminder)(reminderData);
                        successfulReminders++;
                        console.log(`Manual check - reminder sent successfully for expense: ${expense.title} to ${userEmail}`);
                    }
                    catch (emailError) {
                        failedReminders++;
                        console.error(`Manual check - failed to send reminder for expense: ${expense.title} to ${userEmail}`, emailError);
                    }
                }
            }
            catch (userError) {
                console.error(`Manual check - error processing user ${userId}:`, userError);
            }
        }
        return {
            success: true,
            message: 'Manual expense reminder check completed',
            totalReminders,
            successfulReminders,
            failedReminders,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error in manual expense reminder check:', error);
        throw new functions.https.HttpsError('internal', 'Manual expense reminder check failed');
    }
});
//# sourceMappingURL=expenseReminderService.js.map