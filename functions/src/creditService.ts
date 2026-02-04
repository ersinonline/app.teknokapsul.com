import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const collectApiKey = defineSecret('COLLECTAPI_KEY');

type CreditQuery = 'konut' | 'tasit' | 'ihtiyac';

const isValidQuery = (q: unknown): q is CreditQuery => q === 'konut' || q === 'tasit' || q === 'ihtiyac';

export const creditBidProxy = onRequest(
  { cors: true, timeoutSeconds: 30, secrets: [collectApiKey] },
  async (req, res) => {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
      }

      const query = req.query.query;
      const priceRaw = req.query.price;
      const monthRaw = req.query.month;

      if (!isValidQuery(query)) {
        res.status(400).json({ success: false, error: 'Invalid query' });
        return;
      }

      const price = Number(priceRaw);
      const month = Number(monthRaw);

      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(month) || month <= 0) {
        res.status(400).json({ success: false, error: 'Invalid price/month' });
        return;
      }

      const url = `https://api.collectapi.com/credit/creditBid?data.price=${encodeURIComponent(String(price))}&data.month=${encodeURIComponent(
        String(month)
      )}&data.query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: {
          authorization: `apikey ${collectApiKey.value()}`,
          'content-type': 'application/json'
        }
      });

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        logger.warn('CollectAPI non-JSON response', { status: response.status, text: text.slice(0, 200) });
        res.status(502).json({ success: false, error: 'Bad upstream response' });
        return;
      }

      if (!response.ok) {
        logger.warn('CollectAPI error', { status: response.status, body: json });
        res.status(502).json({ success: false, error: 'Upstream error' });
        return;
      }

      res.status(200).json(json);
    } catch (e) {
      logger.error('creditBidProxy failed', e);
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }
);
