import { getUpcomingExpensesForSheets, sendToGoogleSheets } from '../src/services/google-sheets.service';

/**
 * Google Sheets ile senkronizasyon için API endpoint
 * Bu endpoint Firebase'den yaklaşan giderleri alır ve Google Sheets'e gönderir
 */
export default async function handler(req: any, res: any) {
  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Güvenlik için authorization header kontrolü
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting Google Sheets sync...');

    // Yaklaşan giderleri al
    const expenses = await getUpcomingExpensesForSheets();

    if (expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No upcoming expenses found',
        expenseCount: 0
      });
    }

    // Google Sheets webhook URL'si environment variable'dan al
    const googleSheetsWebhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    
    if (!googleSheetsWebhook) {
      console.log('Google Sheets webhook URL not configured, returning data only');
      return res.status(200).json({
        success: true,
        message: 'Data retrieved successfully (webhook not configured)',
        expenseCount: expenses.length,
        expenses: expenses
      });
    }

    // Google Sheets'e veri gönder
    const success = await sendToGoogleSheets(googleSheetsWebhook);

    if (success) {
      return res.status(200).json({
        success: true,
        message: `Successfully synced ${expenses.length} expenses to Google Sheets`,
        expenseCount: expenses.length
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to sync data to Google Sheets',
        expenseCount: expenses.length
      });
    }

  } catch (error) {
    console.error('Error in Google Sheets sync:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET endpoint - Sadece veri görüntüleme için
 * Bu endpoint Google Sheets'e göndermeden sadece yaklaşan giderleri döndürür
 */
export async function GET(req: any, res: any) {
  try {
    const expenses = await getUpcomingExpensesForSheets();
    
    return res.status(200).json({
      success: true,
      expenseCount: expenses.length,
      expenses: expenses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}