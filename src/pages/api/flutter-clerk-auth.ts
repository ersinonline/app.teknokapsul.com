import { NextApiRequest, NextApiResponse } from 'next';
import { processFlutterClerkAuth } from '../../api/clerk-flutter-auth';

/**
 * Flutter Clerk Authentication API Endpoint
 * 
 * Bu endpoint Flutter uygulamasından gelen Clerk session token'larını işler
 * ve web uygulaması için gerekli authentication bilgilerini döner.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS request için preflight response
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sadece POST method'una izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are supported.'
    });
  }

  try {
    const { sessionToken } = req.body;

    // Session token kontrolü
    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Session token is required and must be a string.'
      });
    }

    // Flutter Clerk auth işlemini gerçekleştir
    const result = await processFlutterClerkAuth(sessionToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Authentication failed'
      });
    }

    // Başarılı response
    return res.status(200).json({
      success: true,
      user: result.user,
      firebaseToken: result.firebaseToken,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Flutter Clerk Auth API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

// API route configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};