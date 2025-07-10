import { NextRequest, NextResponse } from 'next/server';
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

export default async function handler(req: NextRequest) {
  // Sadece GET isteklerini kabul et (Zapier için)
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Güvenlik için API key kontrolü
  const apiKey = req.nextUrl.searchParams.get('api_key');
  if (apiKey !== process.env.ZAPIER_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    console.log(`Fetching expenses between ${now.toISOString()} and ${threeDaysLater.toISOString()}`);

    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('teknokapsul').get();
    const expenseReminders = [];

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
        const upcomingExpenses = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            amount: data.amount,
            date: data.date,
            category: data.category,
            dueDate: new Date(data.date).toLocaleDateString('tr-TR')
          };
        });

        // Her kullanıcı için bir reminder objesi oluştur
        expenseReminders.push({
          userId,
          userName: userData.name || 'Kullanıcı',
          userEmail: userData.email,
          expenseCount: upcomingExpenses.length,
          totalAmount: upcomingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
          expenses: upcomingExpenses,
          reminderDate: now.toISOString(),
          daysUntilDue: 3
        });
      }
    }

    // Zapier için uygun formatta döndür
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalReminders: expenseReminders.length,
      reminders: expenseReminders
    });

  } catch (error) {
    console.error('Error in Zapier webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}