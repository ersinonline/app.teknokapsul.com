import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

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

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET ve POST isteklerini kabul et
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Güvenlik için secret kontrolü (query parameter veya header)
  const secretFromQuery = req.query.secret as string;
  const authHeader = req.headers.authorization;
  const secretFromHeader = authHeader?.replace('Bearer ', '');
  
  if (secretFromQuery !== process.env.CRON_SECRET && secretFromHeader !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    console.log(`Checking expenses between ${now.toISOString()} and ${threeDaysLater.toISOString()}`);

    // Tüm kullanıcıları al
    const usersSnapshot = await db.collection('teknokapsul').get();
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

        console.log(`Found ${upcomingExpenses.length} upcoming expenses for user ${userId}`);

        // E-posta içeriği oluştur
        const mailOptions = {
          from: 'Teknokapsül <noreply@teknokapsul.com>',
          to: userData.email,
          subject: 'Yaklaşan Gider Hatırlatması - Teknokapsül',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #2563eb; margin-bottom: 20px;">Merhaba ${userData.name || 'Değerli Kullanıcımız'},</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Aşağıdaki giderlerin ödeme tarihi yaklaşıyor:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${upcomingExpenses.map(expense => 
                      `<li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #374151;">${expense.name}</span>
                        <span style="color: #dc2626; font-weight: 600;">${expense.amount} TL</span>
                        <span style="color: #6b7280; font-size: 14px;">${expense.date}</span>
                      </li>`
                    ).join('')}
                  </ul>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Teknokapsül uygulamasına giriş yaparak detayları görüntüleyebilir ve ödemelerinizi takip edebilirsiniz.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://app.teknokapsul.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Uygulamaya Git</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">İyi günler dileriz.<br>Teknokapsül Ekibi</p>
              </div>
            </div>
          `
        };

        // E-posta gönder
        try {
          await transporter.sendMail(mailOptions);
          emailsSent++;
          console.log(`Email sent successfully to ${userData.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${userData.email}:`, emailError);
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Expense reminder check completed. ${emailsSent} emails sent.`,
      emailsSent 
    });

  } catch (error) {
    console.error('Error in expense reminder function:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}