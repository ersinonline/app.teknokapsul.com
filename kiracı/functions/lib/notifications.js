import admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
// Import createNotification from index
import { createNotification } from './index';
// Payment reminder scheduler - runs daily at 09:00
export const sendPaymentReminders = onSchedule({ schedule: 'every day 09:00', timeZone: 'Europe/Istanbul', region: 'europe-west1' }, async () => {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysLaterTimestamp = admin.firestore.Timestamp.fromDate(threeDaysLater);
    // Find invoices due in 3 days
    const snap = await admin
        .firestore()
        .collectionGroup('invoices')
        .where('status', '==', 'DUE')
        .where('dueDate', '<=', threeDaysLaterTimestamp)
        .limit(200)
        .get();
    for (const invDoc of snap.docs) {
        const inv = invDoc.data();
        const parts = invDoc.ref.path.split('/');
        const ownerUid = parts[1];
        const contractId = parts[3];
        const invoiceId = parts[5];
        // Check if reminder already sent
        if (inv.reminderSent)
            continue;
        const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
        if (!dueDate)
            continue;
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue > 3 || daysUntilDue < 0)
            continue;
        // Get contract to find tenant
        const contractRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`);
        const contractSnap = await contractRef.get();
        if (!contractSnap.exists)
            continue;
        const contract = contractSnap.data();
        const tenantEmail = contract.tenant?.email;
        // Find tenant UID
        if (tenantEmail) {
            try {
                const userRecord = await admin.auth().getUserByEmail(tenantEmail);
                const tenantUid = userRecord.uid;
                // Send notification to tenant
                await createNotification(tenantUid, 'payment_due', '💳 Ödeme Hatırlatması', `${inv.period || ''} dönemi kira ödemeniz ${daysUntilDue} gün içinde yapılmalıdır. Tutar: ${inv.tenantTotal || 0} ₺`, `/invoices`, { contractId, invoiceId, dueDate: dueDate.toISOString() });
                // Mark reminder as sent
                await invDoc.ref.set({ reminderSent: true }, { merge: true });
            }
            catch (e) {
                console.error(`Tenant not found for email ${tenantEmail}:`, e);
            }
        }
        // Also notify landlord
        await createNotification(ownerUid, 'payment_due', '📅 Ödeme Hatırlatması', `${contract.tenant?.name || 'Kiracı'} için ${inv.period || ''} dönemi ödeme ${daysUntilDue} gün içinde yapılmalıdır.`, `/contracts/${contractId}`, { contractId, invoiceId });
    }
});
// Overdue payment notifications - runs daily at 10:00
export const sendOverdueNotifications = onSchedule({ schedule: 'every day 10:00', timeZone: 'Europe/Istanbul', region: 'europe-west1' }, async () => {
    const snap = await admin
        .firestore()
        .collectionGroup('invoices')
        .where('status', '==', 'OVERDUE')
        .limit(200)
        .get();
    for (const invDoc of snap.docs) {
        const inv = invDoc.data();
        const parts = invDoc.ref.path.split('/');
        const ownerUid = parts[1];
        const contractId = parts[3];
        const invoiceId = parts[5];
        // Check if overdue notification already sent today
        const lastNotifSent = inv.lastOverdueNotif?.toDate ? inv.lastOverdueNotif.toDate() : null;
        const now = new Date();
        if (lastNotifSent) {
            const daysSinceLastNotif = Math.floor((now.getTime() - lastNotifSent.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastNotif < 1)
                continue; // Already sent today
        }
        const dueDate = inv.dueDate?.toDate ? inv.dueDate.toDate() : null;
        if (!dueDate)
            continue;
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // Get contract
        const contractRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`);
        const contractSnap = await contractRef.get();
        if (!contractSnap.exists)
            continue;
        const contract = contractSnap.data();
        const tenantEmail = contract.tenant?.email;
        // Notify tenant
        if (tenantEmail) {
            try {
                const userRecord = await admin.auth().getUserByEmail(tenantEmail);
                const tenantUid = userRecord.uid;
                await createNotification(tenantUid, 'payment_due', '⚠️ Gecikmiş Ödeme', `${inv.period || ''} dönemi kira ödemeniz ${daysOverdue} gündür gecikmiştir. Lütfen en kısa sürede ödeme yapınız.`, `/invoices`, { contractId, invoiceId, daysOverdue });
            }
            catch (e) {
                console.error(`Tenant not found for email ${tenantEmail}:`, e);
            }
        }
        // Notify landlord
        await createNotification(ownerUid, 'payment_due', '⚠️ Gecikmiş Ödeme', `${contract.tenant?.name || 'Kiracı'} için ${inv.period || ''} dönemi ödeme ${daysOverdue} gündür gecikmiştir.`, `/contracts/${contractId}`, { contractId, invoiceId, daysOverdue });
        // Update last notification time
        await invDoc.ref.set({ lastOverdueNotif: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
});
