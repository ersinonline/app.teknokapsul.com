import 'dotenv/config';
import cors from 'cors';
import admin from 'firebase-admin';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import crypto from 'node:crypto';

admin.initializeApp();

const corsHandler = cors({ origin: true });

type CreateCheckoutInput = {
  ownerUid: string;
  contractId: string;
  invoiceId: string;
};

const getEnv = (key: string) => {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : null;
};

const sha256Hex = (value: string) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

const clampPayDay = (value: number) => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(30, Math.max(1, Math.floor(value)));
};

const toPeriod = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const addMonths = (date: Date, months: number) => {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
};

const fetchHolidaySet = async (ownerUid: string) => {
  const snap = await admin.firestore().collection(`accounts/${ownerUid}/admin/holidays/days`).get();
  const set = new Set<string>();
  snap.docs.forEach((d) => set.add(d.id));
  return set;
};

const formatDateKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const nextBusinessDay = (date: Date, holidaySet: Set<string>) => {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6 || holidaySet.has(formatDateKey(d))) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

// Notification helper
export const createNotification = async (
  uid: string,
  type: 'payment_due' | 'payment_success' | 'request_new' | 'contract_new' | 'payout_ready' | 'system',
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: any
) => {
  try {
    await admin.firestore().collection(`accounts/${uid}/notifications`).add({
      type,
      title,
      message,
      read: false,
      actionUrl: actionUrl || null,
      metadata: metadata || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('Notification creation error:', e);
  }
};

const computeInvoiceAmounts = (rentBase: number, agentUid?: string | null) => {
  if (agentUid) {
    const tenantTotal = Math.round(rentBase * 1.05);
    const landlordNet = Math.round(rentBase * 0.95);
    const agentRevenue = Math.round(rentBase * 0.02);
    const platformRevenue = tenantTotal - landlordNet - agentRevenue;
    return { tenantTotal, landlordNet, agentRevenue, platformRevenue };
  }
  const tenantTotal = Math.round(rentBase * 1.03);
  const landlordNet = Math.round(rentBase * 0.97);
  const agentRevenue = 0;
  const platformRevenue = tenantTotal - landlordNet;
  return { tenantTotal, landlordNet, agentRevenue, platformRevenue };
};

export const createIyzicoCheckout = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const input = body as Partial<CreateCheckoutInput>;
    if (!input?.ownerUid || !input?.contractId || !input?.invoiceId) {
      res.status(400).json({ error: 'ownerUid, contractId, invoiceId zorunludur.' }); return;
    }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    const callbackUrl = getEnv('IYZICO_CALLBACK_URL');

    if (!apiKey || !secretKey || !callbackUrl) {
      res.status(500).json({ error: 'iyzico env değişkenleri eksik.' }); return;
    }

    const contractRef = admin.firestore().doc(`accounts/${input.ownerUid}/contracts/${input.contractId}`);
    const contractSnap = await contractRef.get();
    if (!contractSnap.exists) { res.status(404).json({ error: 'Sözleşme bulunamadı.' }); return; }
    const contract = contractSnap.data() as any;

    const callerEmail = decoded.email;
    const isLandlord = contract.landlordUid === decoded.uid;
    const isTenant = callerEmail && contract.tenant?.email && String(contract.tenant.email).toLowerCase() === String(callerEmail).toLowerCase();
    if (!isLandlord && !isTenant) { res.status(403).json({ error: 'Yetkiniz yok.' }); return; }

    const invoiceRef = admin
      .firestore()
      .doc(`accounts/${input.ownerUid}/contracts/${input.contractId}/invoices/${input.invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) { res.status(404).json({ error: 'Invoice bulunamadı.' }); return; }
    let invoice = invoiceSnap.data() as any;

    if (invoice.status === 'PAID') { res.status(400).json({ error: 'Bu invoice zaten ödendi.' }); return; }

    // If invoice was refunded, clear old iyzico data so a fresh checkout is created
    if (invoice.status === 'REFUNDED') {
      await invoiceRef.set({
        iyzico: admin.firestore.FieldValue.delete(),
        status: 'DUE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      // Re-read invoice after clearing
      invoice = (await invoiceRef.get()).data() as any;
    }

    const dueDate = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : null;
    const now = new Date();
    const earlyEligible = dueDate ? dueDate.getTime() - now.getTime() >= 7 * 24 * 60 * 60 * 1000 : false;
    const rentBase = typeof invoice.rentBase === 'number' ? invoice.rentBase : Number(contract.rentAmount ?? 0);
    // Always include commission — recalculate if invoice.tenantTotal is missing or equals rentBase
    const amounts = computeInvoiceAmounts(rentBase, contract.agentUid);
    let tenantTotal = typeof invoice.tenantTotal === 'number' && invoice.tenantTotal > rentBase
      ? Number(invoice.tenantTotal)
      : amounts.tenantTotal;

    // Early payment discount: skip late fees but keep commission
    // Gecikme cezası: ilk 5 gün muaf, sonra günlük %1
    let lateFee = 0;
    if (dueDate && now.getTime() > dueDate.getTime() && contract.lateFeeEnabled !== false && !earlyEligible) {
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penaltyDays = Math.max(0, diffDays - 5);
      if (penaltyDays > 0) {
        const baseForPenalty = Number(contract.rentAmount ?? rentBase);
        lateFee = Math.round(baseForPenalty * 0.01 * penaltyDays);
        tenantTotal = tenantTotal + lateFee;
      }
    }

    const Iyzipay = (await import('iyzipay')).default as any;
    const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

    const tenant = contract.tenant || {};
    const identityNumber = tenant.tckn || '11111111111';

    const requestPayload = {
      locale: 'tr',
      conversationId: `${input.contractId}:${input.invoiceId}:${Date.now()}`,
      price: String(tenantTotal),
      paidPrice: String(tenantTotal),
      currency: 'TRY',
      basketId: `${input.contractId}:${input.invoiceId}`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: decoded.uid,
        name: (tenant.name || 'Kiracı').split(' ')[0] || 'Kiracı',
        surname: (tenant.name || 'Kiracı').split(' ').slice(1).join(' ') || ' ',
        gsmNumber: tenant.phone || '+905000000000',
        email: tenant.email || callerEmail || 'unknown@example.com',
        identityNumber,
        registrationAddress: '—',
        ip: req.ip || '127.0.0.1',
        city: '—',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: tenant.name || 'Kiracı',
        city: '—',
        country: 'Turkey',
        address: '—',
      },
      billingAddress: {
        contactName: tenant.name || 'Kiracı',
        city: '—',
        country: 'Turkey',
        address: '—',
      },
      basketItems: [
        {
          id: input.invoiceId,
          name: `Kira ${invoice.period || ''}`.trim(),
          category1: 'Kira',
          itemType: 'VIRTUAL',
          price: String(tenantTotal),
        },
      ],
    };

    try {
      const iyziRes = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(requestPayload, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (!iyziRes || iyziRes.status !== 'success') {
        res.status(500).json({ error: 'iyzico checkout oluşturulamadı.', detail: iyziRes }); return;
      }

      await invoiceRef.set(
        {
          iyzico: {
            checkoutToken: iyziRes.token,
            lastInitAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          paymentTenantTotal: tenantTotal,
          earlyPaymentApplied: earlyEligible,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.status(200).json({
        token: iyziRes.token,
        checkoutFormContent: iyziRes.checkoutFormContent,
        paymentPageUrl: iyziRes.paymentPageUrl,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'iyzico hatası', detail: err?.message || String(err) });
    }
  });
});

export const guestGetContract = onCall({ cors: true }, async (request: any) => {
  const input = request.data as { contractId?: string; token?: string };
  if (!input?.contractId || !input?.token) throw new HttpsError('invalid-argument', 'contractId ve token zorunludur.');

  const tokenHash = sha256Hex(input.token);
  const snap = await admin
    .firestore()
    .collectionGroup('contracts')
    .where('guest.tokenHash', '==', tokenHash)
    .limit(10)
    .get();

  const match = snap.docs.find((d) => d.id === input.contractId);
  if (!match) throw new HttpsError('not-found', 'Sözleşme bulunamadı.');

  const parts = match.ref.path.split('/');
  const ownerUid = parts[1];
  const contract = match.data() as any;

  return {
    ownerUid,
    contractId: match.id,
    contract: {
      status: contract.status,
      payDay: contract.payDay,
      rentAmount: contract.rentAmount,
      tenant: { name: contract.tenant?.name, email: contract.tenant?.email },
    },
  };
});

export const guestListInvoices = onCall({ cors: true }, async (request: any) => {
  const input = request.data as { contractId?: string; token?: string };
  if (!input?.contractId || !input?.token) throw new HttpsError('invalid-argument', 'contractId ve token zorunludur.');

  const tokenHash = sha256Hex(input.token);
  const snap = await admin
    .firestore()
    .collectionGroup('contracts')
    .where('guest.tokenHash', '==', tokenHash)
    .limit(10)
    .get();

  const match = snap.docs.find((d) => d.id === input.contractId);
  if (!match) throw new HttpsError('not-found', 'Sözleşme bulunamadı.');

  const parts = match.ref.path.split('/');
  const ownerUid = parts[1];

  const invSnap = await admin.firestore().collection(`accounts/${ownerUid}/contracts/${input.contractId}/invoices`).get();
  const invoices = invSnap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      period: data.period,
      tenantTotal: data.tenantTotal,
      status: data.status,
      dueDate: data.dueDate,
    };
  });

  return { ownerUid, invoices };
});

export const guestCreateIyzicoCheckout = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const input = body as { contractId?: string; invoiceId?: string; token?: string };
    if (!input?.contractId || !input?.invoiceId || !input?.token) {
      res.status(400).json({ error: 'contractId, invoiceId ve token zorunludur.' }); return;
    }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    const callbackUrl = getEnv('IYZICO_CALLBACK_URL');
    if (!apiKey || !secretKey || !callbackUrl) { res.status(500).json({ error: 'iyzico env değişkenleri eksik.' }); return; }

    const tokenHash = sha256Hex(input.token);
    const snap = await admin
      .firestore()
      .collectionGroup('contracts')
      .where('guest.tokenHash', '==', tokenHash)
      .limit(10)
      .get();
    const match = snap.docs.find((d) => d.id === input.contractId);
    if (!match) { res.status(404).json({ error: 'Sözleşme bulunamadı.' }); return; }

    const parts = match.ref.path.split('/');
    const ownerUid = parts[1];
    const contract = match.data() as any;

    const invoiceRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${input.contractId}/invoices/${input.invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) { res.status(404).json({ error: 'Invoice bulunamadı.' }); return; }
    let invoice = invoiceSnap.data() as any;
    if (invoice.status === 'PAID') { res.status(400).json({ error: 'Bu invoice zaten ödendi.' }); return; }

    // If invoice was refunded, clear old iyzico data so a fresh checkout is created
    if (invoice.status === 'REFUNDED') {
      await invoiceRef.set({
        iyzico: admin.firestore.FieldValue.delete(),
        status: 'DUE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      invoice = (await invoiceRef.get()).data() as any;
    }

    const dueDate = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : null;
    const now = new Date();
    const earlyEligible = dueDate ? dueDate.getTime() - now.getTime() >= 7 * 24 * 60 * 60 * 1000 : false;
    const rentBase = typeof invoice.rentBase === 'number' ? invoice.rentBase : Number(contract.rentAmount ?? 0);
    // Always include commission — recalculate if invoice.tenantTotal is missing or equals rentBase
    const guestAmounts = computeInvoiceAmounts(rentBase, contract.agentUid);
    let tenantTotal = typeof invoice.tenantTotal === 'number' && invoice.tenantTotal > rentBase
      ? Number(invoice.tenantTotal)
      : guestAmounts.tenantTotal;

    // Gecikme cezası: ilk 5 gün muaf, sonra günlük %1
    let guestLateFee = 0;
    if (dueDate && now.getTime() > dueDate.getTime() && contract.lateFeeEnabled !== false && !earlyEligible) {
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const penaltyDays = Math.max(0, diffDays - 5);
      if (penaltyDays > 0) {
        const baseForPenalty = Number(contract.rentAmount ?? rentBase);
        guestLateFee = Math.round(baseForPenalty * 0.01 * penaltyDays);
        tenantTotal = tenantTotal + guestLateFee;
      }
    }

    const Iyzipay = (await import('iyzipay')).default as any;
    const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

    const tenant = contract.tenant || {};
    const identityNumber = tenant.tckn || '11111111111';
    const requestPayload = {
      locale: 'tr',
      conversationId: `${input.contractId}:${input.invoiceId}:${Date.now()}`,
      price: String(tenantTotal),
      paidPrice: String(tenantTotal),
      currency: 'TRY',
      basketId: `${input.contractId}:${input.invoiceId}`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: `guest:${input.contractId}`,
        name: (tenant.name || 'Kiracı').split(' ')[0] || 'Kiracı',
        surname: (tenant.name || 'Kiracı').split(' ').slice(1).join(' ') || ' ',
        gsmNumber: tenant.phone || '+905000000000',
        email: tenant.email || 'unknown@example.com',
        identityNumber,
        registrationAddress: '—',
        ip: req.ip || '127.0.0.1',
        city: '—',
        country: 'Turkey',
      },
      shippingAddress: { contactName: tenant.name || 'Kiracı', city: '—', country: 'Turkey', address: '—' },
      billingAddress: { contactName: tenant.name || 'Kiracı', city: '—', country: 'Turkey', address: '—' },
      basketItems: [
        { id: input.invoiceId, name: `Kira ${invoice.period || ''}`.trim(), category1: 'Kira', itemType: 'VIRTUAL', price: String(tenantTotal) },
      ],
    };

    try {
      const iyziRes = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(requestPayload, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (!iyziRes || iyziRes.status !== 'success') { res.status(500).json({ error: 'iyzico checkout oluşturulamadı.', detail: iyziRes }); return; }

      await invoiceRef.set(
        {
          iyzico: { checkoutToken: iyziRes.token, lastInitAt: admin.firestore.FieldValue.serverTimestamp() },
          paymentTenantTotal: tenantTotal,
          earlyPaymentApplied: earlyEligible,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.status(200).json({ token: iyziRes.token, checkoutFormContent: iyziRes.checkoutFormContent, paymentPageUrl: iyziRes.paymentPageUrl });
    } catch (err: any) {
      res.status(500).json({ error: 'iyzico hatası', detail: err?.message || String(err) });
    }
  });
});

export const createUpfrontCheckout = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { ownerUid, contractId, offerId } = body as { ownerUid?: string; contractId?: string; offerId?: string };
    if (!ownerUid || !contractId || !offerId) { res.status(400).json({ error: 'ownerUid, contractId, offerId zorunludur.' }); return; }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    const callbackUrl = getEnv('IYZICO_CALLBACK_URL');
    if (!apiKey || !secretKey || !callbackUrl) { res.status(500).json({ error: 'iyzico env değişkenleri eksik.' }); return; }

    const offerRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/upfront_offers/${offerId}`);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) { res.status(404).json({ error: 'Teklif bulunamadı.' }); return; }
    const offer = offerSnap.data() as any;
    if (offer.status !== 'ACCEPTED') { res.status(400).json({ error: 'Teklif henüz onaylanmamış.' }); return; }
    if (offer.paidAt) { res.status(400).json({ error: 'Bu teklif zaten ödendi.' }); return; }

    const contractRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`);
    const contractSnap = await contractRef.get();
    if (!contractSnap.exists) { res.status(404).json({ error: 'Sözleşme bulunamadı.' }); return; }
    const contract = contractSnap.data() as any;

    const callerEmail = decoded.email;
    const isTenant = callerEmail && contract.tenant?.email && String(contract.tenant.email).toLowerCase() === String(callerEmail).toLowerCase();
    if (!isTenant) { res.status(403).json({ error: 'Sadece kiracı ödeme yapabilir.' }); return; }

    const amount = Number(offer.offerAmount);
    const Iyzipay = (await import('iyzipay')).default as any;
    const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

    const tenant = contract.tenant || {};
    const identityNumber = tenant.tckn || '11111111111';

    const requestPayload = {
      locale: 'tr',
      conversationId: `upfront:${contractId}:${offerId}:${Date.now()}`,
      price: String(amount),
      paidPrice: String(amount),
      currency: 'TRY',
      basketId: `upfront:${contractId}:${offerId}`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: decoded.uid,
        name: (tenant.name || 'Kiracı').split(' ')[0] || 'Kiracı',
        surname: (tenant.name || 'Kiracı').split(' ').slice(1).join(' ') || ' ',
        gsmNumber: tenant.phone || '+905000000000',
        email: tenant.email || callerEmail || 'unknown@example.com',
        identityNumber,
        registrationAddress: '—',
        ip: req.ip || '127.0.0.1',
        city: '—',
        country: 'Turkey',
      },
      shippingAddress: { contactName: tenant.name || 'Kiracı', city: '—', country: 'Turkey', address: '—' },
      billingAddress: { contactName: tenant.name || 'Kiracı', city: '—', country: 'Turkey', address: '—' },
      basketItems: [
        { id: offerId, name: `Peşin Ödeme (${offer.months} ay)`, category1: 'Kira', itemType: 'VIRTUAL', price: String(amount) },
      ],
    };

    try {
      const iyziRes = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(requestPayload, (err: any, result: any) => {
          if (err) reject(err); else resolve(result);
        });
      });

      if (!iyziRes || iyziRes.status !== 'success') { res.status(500).json({ error: 'iyzico checkout oluşturulamadı.', detail: iyziRes }); return; }

      await offerRef.set({
        iyzico: { checkoutToken: iyziRes.token, lastInitAt: admin.firestore.FieldValue.serverTimestamp() },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.status(200).json({ token: iyziRes.token, checkoutFormContent: iyziRes.checkoutFormContent, paymentPageUrl: iyziRes.paymentPageUrl });
    } catch (err: any) {
      res.status(500).json({ error: 'iyzico hatası', detail: err?.message || String(err) });
    }
  });
});

export const createIndependentCheckout = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { paymentId, rentAmount: rentStr, landlordName, description } = body as any;
    if (!paymentId || !rentStr) { res.status(400).json({ error: 'paymentId ve rentAmount zorunludur.' }); return; }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    const callbackUrl = getEnv('IYZICO_CALLBACK_URL');
    if (!apiKey || !secretKey || !callbackUrl) { res.status(500).json({ error: 'iyzico env değişkenleri eksik.' }); return; }

    const rent = Number(rentStr);
    const commission = Math.round(rent * 0.10);
    const total = rent + commission;

    const Iyzipay = (await import('iyzipay')).default as any;
    const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

    const requestPayload = {
      locale: 'tr',
      conversationId: `independent:${paymentId}:${Date.now()}`,
      price: String(total),
      paidPrice: String(total),
      currency: 'TRY',
      basketId: `independent:${paymentId}`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: decoded.uid,
        name: (decoded.name || 'Kiracı').split(' ')[0] || 'Kiracı',
        surname: (decoded.name || 'Kiracı').split(' ').slice(1).join(' ') || ' ',
        gsmNumber: '+905000000000',
        email: decoded.email || 'unknown@example.com',
        identityNumber: '11111111111',
        registrationAddress: '—',
        ip: req.ip || '127.0.0.1',
        city: '—',
        country: 'Turkey',
      },
      shippingAddress: { contactName: landlordName || 'Ev Sahibi', city: '—', country: 'Turkey', address: '—' },
      billingAddress: { contactName: landlordName || 'Ev Sahibi', city: '—', country: 'Turkey', address: '—' },
      basketItems: [
        { id: paymentId, name: description || 'Kira Ödemesi', category1: 'Kira', itemType: 'VIRTUAL', price: String(total) },
      ],
    };

    try {
      const iyziRes = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(requestPayload, (err: any, result: any) => {
          if (err) reject(err); else resolve(result);
        });
      });

      if (!iyziRes || iyziRes.status !== 'success') { res.status(500).json({ error: 'iyzico checkout oluşturulamadı.', detail: iyziRes }); return; }

      // Save checkout token to standalone_payments
      await admin.firestore().doc(`accounts/${decoded.uid}/standalone_payments/${paymentId}`).set({
        iyzico: { checkoutToken: iyziRes.token, lastInitAt: admin.firestore.FieldValue.serverTimestamp() },
        totalPaid: total,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.status(200).json({ token: iyziRes.token, checkoutFormContent: iyziRes.checkoutFormContent, paymentPageUrl: iyziRes.paymentPageUrl });
    } catch (err: any) {
      res.status(500).json({ error: 'iyzico hatası', detail: err?.message || String(err) });
    }
  });
});

export const iyzicoWebhook = onRequest({ region: 'europe-west1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    const siteUrl = getEnv('SITE_URL') || 'https://superapp-37db4.web.app';
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const apiKey = getEnv('IYZICO_API_KEY');
      const secretKey = getEnv('IYZICO_SECRET_KEY');
      const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const token = body?.token || body?.checkoutToken;
      console.log('iyzicoWebhook: incoming body', JSON.stringify(body));

      if (!token) {
        console.error('iyzicoWebhook: no token in body');
        res.redirect(302, `${siteUrl}/payment-result?status=error`);
        return;
      }

      // Retrieve actual payment result from iyzico
      let status: string = 'PENDING';
      let retrieveResult: any = null;
      if (apiKey && secretKey) {
        try {
          const Iyzipay = (await import('iyzipay')).default as any;
          const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });
          retrieveResult = await new Promise((resolve, reject) => {
            iyzipay.checkoutForm.retrieve(
              { locale: 'tr', conversationId: String(Date.now()), token },
              (err: any, result: any) => (err ? reject(err) : resolve(result))
            );
          });
          console.log('iyzicoWebhook retrieve:', JSON.stringify(retrieveResult));
          const ps = retrieveResult?.paymentStatus;
          const rs = retrieveResult?.status;
          if (ps === 'SUCCESS' || rs === 'success') status = 'SUCCESS';
          else if (ps === 'FAILURE' || rs === 'failure') status = 'REJECTED';
          else status = 'PENDING';
        } catch (e: any) {
          console.error('iyzicoWebhook retrieve error:', e?.message || e);
          const bs = body?.status || body?.paymentStatus;
          if (bs === 'SUCCESS' || bs === 'success') status = 'SUCCESS';
        }
      } else {
        console.error('iyzicoWebhook: missing API keys');
        const bs = body?.status || body?.paymentStatus;
        if (bs === 'SUCCESS' || bs === 'success') status = 'SUCCESS';
      }
      console.log('iyzicoWebhook resolved status:', status, 'token:', token);

      // 1. Check regular invoices
      let invoicesSnap: admin.firestore.QuerySnapshot | null = null;
      try {
        invoicesSnap = await admin.firestore().collectionGroup('invoices').where('iyzico.checkoutToken', '==', token).limit(1).get();
      } catch (e: any) { console.error('iyzicoWebhook invoices query error:', e?.message); }

      // 2. Check upfront offers
      let upfrontSnap: admin.firestore.QuerySnapshot | null = null;
      try {
        upfrontSnap = await admin.firestore().collectionGroup('upfront_offers').where('iyzico.checkoutToken', '==', token).limit(1).get();
      } catch (e: any) { console.error('iyzicoWebhook upfront query error:', e?.message); }

      // 3. Check standalone payments
      let standaloneSnap: admin.firestore.QuerySnapshot | null = null;
      try {
        standaloneSnap = await admin.firestore().collectionGroup('standalone_payments').where('iyzico.checkoutToken', '==', token).limit(1).get();
      } catch (e: any) { console.error('iyzicoWebhook standalone query error:', e?.message); }

      if ((!invoicesSnap || invoicesSnap.empty) && (!upfrontSnap || upfrontSnap.empty) && (!standaloneSnap || standaloneSnap.empty)) {
        console.error('iyzicoWebhook: no matching document for token', token);
        res.redirect(302, `${siteUrl}/payment-result?status=error`);
        return;
      }

      const mapped =
        status === 'SUCCESS'
          ? 'PAID'
          : status === 'PENDING'
            ? 'PAYMENT_PENDING'
            : status === 'REJECTED'
              ? 'FAILED'
              : null;

      // Handle upfront offer payment
      if (upfrontSnap && !upfrontSnap.empty) {
        const offerRef = upfrontSnap.docs[0].ref;
        const offerPath = offerRef.path.split('/');
        const ownerUid = offerPath[1];
        const contractId = offerPath[3];

        if (mapped === 'PAID') {
          await offerRef.set({ status: 'PAID', paidAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

          // Close covered monthly invoices as CLOSED_UPFRONT
          const offer = (await offerRef.get()).data() as any;
          const months = offer?.months || 0;
          if (months > 0) {
            const invoicesRef = admin.firestore().collection(`accounts/${ownerUid}/contracts/${contractId}/invoices`);
            const allInv = await invoicesRef.where('status', 'in', ['DUE', 'OVERDUE']).orderBy('period', 'asc').limit(months).get();
            for (const inv of allInv.docs) {
              await inv.ref.set({ status: 'CLOSED_UPFRONT', upfrontOfferId: offerRef.id, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }
          }

          // Plan payout
          const holidaySet = await fetchHolidaySet(ownerUid);
          const plannedBase = new Date();
          plannedBase.setDate(plannedBase.getDate() + 8);
          const planned = nextBusinessDay(plannedBase, holidaySet);
          await admin.firestore().doc(`accounts/${ownerUid}/payouts/upfront_${offerRef.id}`).set({
            landlordUid: ownerUid,
            contractId,
            type: 'UPFRONT',
            offerId: offerRef.id,
            amount: Number(offer?.offerAmount || 0),
            plannedAt: admin.firestore.Timestamp.fromDate(planned),
            status: 'PLANNED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // Create wallet transaction for upfront payment
          const offerAmount = Number(offer?.offerAmount || 0);
          if (offerAmount > 0) {
            const contractSnap = await admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`).get();
            const contractData = contractSnap.data() as any;

            await admin
              .firestore()
              .collection(`accounts/${ownerUid}/wallet`)
              .add({
                type: 'UPFRONT_PAYMENT',
                amount: offerAmount,
                contractId,
                offerId: offerRef.id,
                tenantName: contractData?.tenant?.name || 'Kiracı',
                period: `${offer?.months || 0} Aylık Peşin`,
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'BLOCKED',
                payoutId: `upfront_${offerRef.id}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                description: `${offer?.months || 0} aylık peşin ödeme alındı`,
              });
          }
        } else if (mapped) {
          await offerRef.set({ updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }

        const resultStatus = mapped === 'PAID' ? 'success' : mapped === 'FAILED' ? 'failed' : 'pending';
        res.redirect(302, `${siteUrl}/payment-result?status=${resultStatus}`);
        return;
      }

      // Handle standalone payment
      if (standaloneSnap && !standaloneSnap.empty) {
        const spRef = standaloneSnap.docs[0].ref;
        const spData = (await spRef.get()).data() as any;
        if (mapped) {
          await spRef.set({
            status: mapped,
            paidAt: mapped === 'PAID' ? admin.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        // If this is a deposit payment and it succeeded, mark contract depositPaid
        if (mapped === 'PAID' && spData?.type === 'DEPOSIT') {
          const spPath = spRef.path.split('/');
          const spOwnerUid = spPath[1];
          const spContractId = spPath[3];
          try {
            await admin.firestore().doc(`accounts/${spOwnerUid}/contracts/${spContractId}`).set({
              depositPaid: true,
              depositPaidAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          } catch (e: any) { console.error('deposit mark error:', e?.message); }
        }
        const resultStatus = mapped === 'PAID' ? 'success' : mapped === 'FAILED' ? 'failed' : 'pending';
        res.redirect(302, `${siteUrl}/payment-result?status=${resultStatus}`);
        return;
      }

      // Handle regular invoice payment
      const invRef = invoicesSnap!.docs[0].ref;
      const invPath = invRef.path.split('/');
      const ownerUid = invPath[1];
      const contractId = invPath[3];
      const invoiceId = invPath[5];

      if (mapped) {
        const paymentId = (retrieveResult as any)?.paymentId;
        const updatePayload: any = {
          status: mapped,
          paidAt: mapped === 'PAID' ? admin.firestore.FieldValue.serverTimestamp() : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (paymentId) {
          updatePayload.iyzico = { paymentId };
        }

        await invRef.set(
          updatePayload,
          { merge: true }
        );
      }

      if (mapped === 'PAID' && ownerUid && contractId && invoiceId) {
        const invSnap = await invRef.get();
        const inv = invSnap.data() as any;
        const net = typeof inv?.landlordNet === 'number' ? inv.landlordNet : null;
        const paidAt = inv?.paidAt?.toDate ? inv.paidAt.toDate() : new Date();
        const holidaySet = await fetchHolidaySet(ownerUid);
        const plannedBase = new Date(paidAt.getTime());
        plannedBase.setDate(plannedBase.getDate() + 8);
        const planned = nextBusinessDay(plannedBase, holidaySet);

        await admin
          .firestore()
          .doc(`accounts/${ownerUid}/payouts/${invoiceId}`)
          .set(
            {
              landlordUid: ownerUid,
              contractId,
              invoiceId,
              amount: net,
              plannedAt: admin.firestore.Timestamp.fromDate(planned),
              status: 'PLANNED',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        // Create wallet transaction
        if (net && net > 0) {
          const contractSnap = await admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`).get();
          const contractData = contractSnap.data() as any;

          await admin
            .firestore()
            .collection(`accounts/${ownerUid}/wallet`)
            .add({
              type: 'PAYMENT_RECEIVED',
              amount: net,
              contractId,
              invoiceId,
              period: inv?.period || '',
              tenantName: contractData?.tenant?.name || 'Kiracı',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'BLOCKED',
              payoutId: invoiceId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              description: `${inv?.period || ''} dönemi kira ödemesi alındı`,
            });
        }

        await invRef.set({ payoutPlanned: true }, { merge: true });
      }

      const resultStatus = mapped === 'PAID' ? 'success' : mapped === 'FAILED' ? 'failed' : 'pending';
      res.redirect(302, `${siteUrl}/payment-result?status=${resultStatus}`);
    } catch (outerErr: any) {
      console.error('iyzicoWebhook FATAL:', outerErr?.message || outerErr);
      res.redirect(302, `${siteUrl}/payment-result?status=error`);
    }
  });
});

export const generateInvoicesDaily = onSchedule(
  { schedule: 'every day 01:05', timeZone: 'Europe/Istanbul', region: 'europe-west1' },
  async () => {
    const statuses = ['EDEVLET_APPROVED', 'ACTIVE'];
    const contracts: admin.firestore.QueryDocumentSnapshot[] = [];

    for (const status of statuses) {
      const snap = await admin.firestore().collectionGroup('contracts').where('status', '==', status).limit(500).get();
      contracts.push(...snap.docs);
    }

    for (const docSnap of contracts) {
      const contract = docSnap.data() as any;
      const parts = docSnap.ref.path.split('/');
      const ownerUid = parts[1];
      const contractId = parts[3];
      const startDate = contract.startDate?.toDate ? contract.startDate.toDate() : null;
      if (!startDate) continue;

      const payDay = clampPayDay(Number(contract.payDay || 1));
      const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const startMonthDue = new Date(base.getFullYear(), base.getMonth(), payDay);
      const firstDue = base.getDate() > payDay ? new Date(base.getFullYear(), base.getMonth() + 1, payDay) : startMonthDue;

      const rentBase = Number(contract.rentAmount || 0);
      const amounts = computeInvoiceAmounts(rentBase, contract.agentUid);

      for (let i = 0; i < 12; i += 1) {
        const due = new Date(firstDue.getFullYear(), firstDue.getMonth() + i, payDay);
        const period = toPeriod(due);
        const invRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/invoices/${period}`);
        const existing = await invRef.get();
        if (existing.exists) continue;
        await invRef.set(
          {
            period,
            dueDate: admin.firestore.Timestamp.fromDate(due),
            rentBase,
            tenantTotal: amounts.tenantTotal,
            landlordNet: amounts.landlordNet,
            platformRevenue: amounts.platformRevenue,
            agentRevenue: amounts.agentRevenue,
            tenantEmail: contract.tenant?.email || null,
            status: 'DUE',
            isRed: false,
            lateFeeEnabled: contract.lateFeeEnabled ?? true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }
);

export const recalcLateFees = onSchedule(
  { schedule: 'every day 00:20', timeZone: 'Europe/Istanbul', region: 'europe-west1' },
  async () => {
    const snap = await admin.firestore().collectionGroup('invoices').where('status', '==', 'OVERDUE').limit(500).get();
    const now = new Date();
    const batch = admin.firestore().batch();
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      if (!data?.lateFeeEnabled) return;
      const due = data?.dueDate?.toDate ? data.dueDate.toDate() : null;
      if (!due) return;
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
      const lateDays = Math.max(0, diffDays);
      const chargeable = Math.max(0, lateDays - 5);
      const rentBase = Number(data.rentBase || 0);
      const lateFeeAmount = Math.round(rentBase * 0.01 * chargeable);
      batch.set(
        d.ref,
        {
          lateDays,
          lateFeeAmount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    if (!snap.empty) await batch.commit();
  }
);

export const generateInvoicesForContract = onCall({ cors: true }, async (request: any) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Giriş gerekli.');
  const input = request.data as { ownerUid?: string; contractId?: string };
  if (!input?.ownerUid || !input?.contractId) {
    throw new HttpsError('invalid-argument', 'ownerUid ve contractId zorunludur.');
  }

  return await generateInvoicesForContractInternal({
    authUid: request.auth.uid,
    authEmail: request.auth.token.email as string | undefined,
    ownerUid: input.ownerUid,
    contractId: input.contractId,
  });
});

const generateInvoicesForContractInternal = async (params: {
  authUid: string;
  authEmail?: string;
  ownerUid: string;
  contractId: string;
}) => {
  const contractRef = admin.firestore().doc(`accounts/${params.ownerUid}/contracts/${params.contractId}`);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) throw new HttpsError('not-found', 'Sözleşme bulunamadı.');
  const contract = contractSnap.data() as any;

  const isLandlord = contract.landlordUid === params.authUid;
  const isTenant =
    params.authEmail &&
    contract.tenant?.email &&
    String(contract.tenant.email).toLowerCase() === String(params.authEmail).toLowerCase();
  if (!isLandlord && !isTenant) throw new HttpsError('permission-denied', 'Yetkiniz yok.');

  const invCol = admin.firestore().collection(`accounts/${params.ownerUid}/contracts/${params.contractId}/invoices`);
  const existing = await invCol.limit(1).get();
  if (!existing.empty) {
    return { created: 0 };
  }

  const startDate = contract.startDate?.toDate ? contract.startDate.toDate() : null;
  if (!startDate) throw new HttpsError('failed-precondition', 'Sözleşme başlangıç tarihi eksik.');
  const payDay = clampPayDay(Number(contract.payDay || 1));
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const startMonthDue = new Date(base.getFullYear(), base.getMonth(), payDay);
  const firstDue = base.getDate() > payDay ? new Date(base.getFullYear(), base.getMonth() + 1, payDay) : startMonthDue;

  const rentBase = Number(contract.rentAmount || 0);
  const amounts = computeInvoiceAmounts(rentBase, contract.agentUid);

  for (let i = 0; i < 12; i += 1) {
    const due = new Date(firstDue.getFullYear(), firstDue.getMonth() + i, payDay);
    const period = toPeriod(due);
    await invCol.doc(period).set(
      {
        period,
        dueDate: admin.firestore.Timestamp.fromDate(due),
        rentBase,
        tenantTotal: amounts.tenantTotal,
        landlordNet: amounts.landlordNet,
        platformRevenue: amounts.platformRevenue,
        agentRevenue: amounts.agentRevenue,
        tenantEmail: contract.tenant?.email || null,
        status: 'DUE',
        isRed: false,
        lateFeeEnabled: contract.lateFeeEnabled ?? true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { created: 12 };
};

export const generateInvoicesForContractHttp = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'auth-required' });
      return;
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const ownerUid = body?.ownerUid;
    const contractId = body?.contractId;
    if (!ownerUid || !contractId) {
      res.status(400).json({ error: 'ownerUid-contractId-required' });
      return;
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const result = await generateInvoicesForContractInternal({
      authUid: decoded.uid,
      authEmail: decoded.email,
      ownerUid,
      contractId,
    });
    res.status(200).json(result);
  });
});

export const schedulePayoutsDaily = onSchedule(
  { schedule: 'every day 02:05', timeZone: 'Europe/Istanbul', region: 'europe-west1' },
  async () => {
    const snap = await admin
      .firestore()
      .collectionGroup('invoices')
      .where('status', '==', 'PAID')
      .limit(500)
      .get();

    for (const invDoc of snap.docs) {
      const inv = invDoc.data() as any;
      if (inv.payoutPlanned) continue;
      const parts = invDoc.ref.path.split('/');
      const ownerUid = parts[1];
      const contractId = parts[3];
      const invoiceId = parts[5];
      const paidAt = inv?.paidAt?.toDate ? inv.paidAt.toDate() : new Date();
      const holidaySet = await fetchHolidaySet(ownerUid);
      const plannedBase = new Date(paidAt.getTime());
      plannedBase.setDate(plannedBase.getDate() + 8);
      const planned = nextBusinessDay(plannedBase, holidaySet);

      await admin
        .firestore()
        .doc(`accounts/${ownerUid}/payouts/${invoiceId}`)
        .set(
          {
            landlordUid: ownerUid,
            contractId,
            invoiceId,
            amount: typeof inv?.landlordNet === 'number' ? inv.landlordNet : null,
            plannedAt: admin.firestore.Timestamp.fromDate(planned),
            status: 'PLANNED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      await invDoc.ref.set({ payoutPlanned: true }, { merge: true });
    }
  }
);

export const renewalAutomation = onSchedule(
  { schedule: 'every day 03:05', timeZone: 'Europe/Istanbul', region: 'europe-west1' },
  async () => {
    const snap = await admin.firestore().collectionGroup('contracts').where('status', '==', 'ACTIVE').limit(500).get();
    const now = new Date();
    for (const docSnap of snap.docs) {
      const contract = docSnap.data() as any;
      const parts = docSnap.ref.path.split('/');
      const ownerUid = parts[1];
      const contractId = parts[3];
      const startDate = contract.startDate?.toDate ? contract.startDate.toDate() : null;
      if (!startDate) continue;
      const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

      if (months >= 11 && !contract.renewal?.status) {
        const p = 25;
        const newRentAmount = Math.round(Number(contract.rentAmount || 0) * (1 + p / 100));
        await docSnap.ref.set(
          {
            renewal: {
              status: 'OFFERED',
              increasePercent: p,
              newRentAmount,
              offeredAt: admin.firestore.FieldValue.serverTimestamp(),
              offeredByUid: contract.landlordUid || ownerUid,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (months >= 12 && contract.renewal?.status === 'ACCEPTED' && contract.renewal?.newRentAmount) {
        await docSnap.ref.set(
          {
            rentAmount: contract.renewal.newRentAmount,
            renewal: {
              ...contract.renewal,
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }
);

export const markOverdueInvoices = onSchedule({ schedule: 'every day 00:05', timeZone: 'Europe/Istanbul', region: 'europe-west1' }, async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await admin
    .firestore()
    .collectionGroup('invoices')
    .where('status', '==', 'DUE')
    .where('dueDate', '<', now)
    .limit(200)
    .get();

  const batch = admin.firestore().batch();
  snap.docs.forEach((d) => {
    batch.set(
      d.ref,
      {
        status: 'OVERDUE',
        isRed: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const parts = d.ref.path.split('/');
    const ownerUid = parts[1];
    const invoiceId = parts[5];
    const contractId = parts[3];
    const caseRef = admin.firestore().doc(`accounts/${ownerUid}/legal_cases/${invoiceId}`);
    batch.set(
      caseRef,
      {
        landlordUid: ownerUid,
        contractId,
        invoiceId,
        status: 'OPEN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        checklist: {
          noticeSent: false,
          enforcementStarted: false,
          evictionFiled: false,
        },
      },
      { merge: true }
    );
  });

  if (!snap.empty) await batch.commit();
});

// Check iyzico payment status for invoices with a checkoutToken
// Helper for iyzico promisification
const iyzicoRequest = (method: any, params: any) => {
  return new Promise<any>((resolve, reject) => {
    method(params, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const checkPaymentStatus = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    try { await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { ownerUid, contractId, invoiceId } = body || {};
    if (!ownerUid || !contractId || !invoiceId) {
      res.status(400).json({ error: 'ownerUid, contractId, invoiceId zorunludur.' }); return;
    }

    const invoiceRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) { res.status(404).json({ error: 'Invoice bulunamadı.' }); return; }
    const invoice = invoiceSnap.data() as any;

    // Skip REFUNDED invoices — old iyzico data is stale, don't flip back to PAID
    if (invoice.status === 'REFUNDED') {
      res.status(200).json({ status: 'REFUNDED', changed: false });
      return;
    }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    if (!apiKey || !secretKey) { res.status(500).json({ error: 'iyzico env eksik.' }); return; }

    try {
      const Iyzipay = (await import('iyzipay')).default as any;
      const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

      let result: any = null;
      const paymentId = invoice.iyzico?.paymentId;
      const checkoutToken = invoice.iyzico?.checkoutToken;

      // 1. Retrieve Payment Details
      if (paymentId) {
        // Retrieve by paymentId
        result = await iyzicoRequest(iyzipay.payment.retrieve.bind(iyzipay.payment), {
          locale: 'tr',
          conversationId: String(Date.now()),
          paymentId
        });
      } else if (checkoutToken) {
        // Retrieve by checkoutForm first
        const formResult = await iyzicoRequest(iyzipay.checkoutForm.retrieve.bind(iyzipay.checkoutForm), {
          locale: 'tr',
          conversationId: String(Date.now()),
          token: checkoutToken
        });

        if (formResult?.paymentId) {
          // Save paymentId for future
          await invoiceRef.set({ iyzico: { paymentId: formResult.paymentId } }, { merge: true });
          // Now retrieve full payment details
          result = await iyzicoRequest(iyzipay.payment.retrieve.bind(iyzipay.payment), {
            locale: 'tr',
            conversationId: String(Date.now()),
            paymentId: formResult.paymentId
          });
        } else {
          result = formResult;
        }
      }

      const ps = result?.paymentStatus; // SUCCESS, FAILURE, INIT
      const rs = result?.status; // success, failure

      let mapped: string | null = null;
      if (ps === 'SUCCESS' || rs === 'success') mapped = 'PAID';
      else if (ps === 'FAILURE' || rs === 'failure') mapped = 'FAILED';

      // 2. Check for IYZICO FAILURE/CANCEL on a PAID invoice
      // If invoice says PAID but iyzico says FAILURE or price is 0
      if (invoice.status === 'PAID' && (ps === 'FAILURE' || (result?.price === 0) || (result?.itemTransactions || []).some((item: any) => item.transactionStatus !== 2))) {
        console.log('Payment REFUND/CANCEL detected for invoice:', invoiceId);

        // Mark invoice as REFUNDED so UI shows "Tekrar Öde" button
        await invoiceRef.set({
          status: 'REFUNDED',
          paidAt: null,
          payoutPlanned: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Cancel Payout (delete or update status)
        await admin.firestore().doc(`accounts/${ownerUid}/payouts/${invoiceId}`).delete();

        res.status(200).json({ status: 'REFUNDED', changed: true });
        return;
      }

      // 3. Regular Update Logic (existing logic)
      if (mapped && mapped !== invoice.status) {
        const updateData: any = {
          status: mapped,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (mapped === 'PAID') {
          updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await invoiceRef.set(updateData, { merge: true });

        // If PAID, also plan payout
        if (mapped === 'PAID') {
          const inv = (await invoiceRef.get()).data() as any;
          const net = typeof inv?.landlordNet === 'number' ? inv.landlordNet : null;
          const paidAt = inv?.paidAt?.toDate ? inv.paidAt.toDate() : new Date();
          const holidaySet = await fetchHolidaySet(ownerUid);
          const plannedBase = new Date(paidAt.getTime());
          plannedBase.setDate(plannedBase.getDate() + 8);
          const planned = nextBusinessDay(plannedBase, holidaySet);

          await admin.firestore().doc(`accounts/${ownerUid}/payouts/${invoiceId}`).set({
            landlordUid: ownerUid,
            contractId,
            invoiceId,
            amount: net,
            plannedAt: admin.firestore.Timestamp.fromDate(planned),
            status: 'PLANNED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          await invoiceRef.set({ payoutPlanned: true }, { merge: true });

          // Also create wallet entry (payout) if missing logic handled elsewhere mostly, 
          // but here we ensure payout document is created which Wallet uses.
        }

        res.status(200).json({ status: mapped, changed: true });
      } else {
        res.status(200).json({ status: invoice.status, changed: false });
      }
    } catch (err: any) {
      console.error('checkPaymentStatus error:', err?.message || err);
      res.status(500).json({ error: 'iyzico sorgulama hatası.' });
    }
  });
});

// ─── Deposit Checkout ──────────────────────────────────────────────────
export const createDepositCheckout = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { ownerUid, contractId, amount } = body || {};
    if (!ownerUid || !contractId || !amount) {
      res.status(400).json({ error: 'ownerUid, contractId, amount zorunludur.' }); return;
    }

    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    const callbackUrl = getEnv('IYZICO_CALLBACK_URL');
    if (!apiKey || !secretKey || !callbackUrl) {
      res.status(500).json({ error: 'iyzico env değişkenleri eksik.' }); return;
    }

    const contractRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`);
    const contractSnap = await contractRef.get();
    if (!contractSnap.exists) { res.status(404).json({ error: 'Sözleşme bulunamadı.' }); return; }
    const contract = contractSnap.data() as any;

    // Check if deposit already paid
    if (contract.depositPaid) { res.status(400).json({ error: 'Depozito zaten ödendi.' }); return; }

    const callerEmail = decoded.email;
    const isLandlord = contract.landlordUid === decoded.uid;
    const isTenant = callerEmail && contract.tenant?.email && String(contract.tenant.email).toLowerCase() === String(callerEmail).toLowerCase();
    if (!isLandlord && !isTenant) { res.status(403).json({ error: 'Yetkiniz yok.' }); return; }

    const depositBase = Number(amount);
    if (depositBase <= 0) { res.status(400).json({ error: 'Geçersiz tutar.' }); return; }

    // Depozito = 3 kira tutarı. 2 kira ev sahibine, 1 kira platform işlem ücreti.
    // depositBase zaten 3 kira tutarı olarak gelir (sözleşmede depositAmount = rentAmount * 3)
    const rentAmount = contract.rentAmount || 0;
    const tenantTotal = rentAmount * 3; // kiracı 3 kira öder
    const landlordNet = rentAmount * 2; // 2 kira ev sahibine
    const agentRevenue = 0;
    const platformRevenue = rentAmount; // 1 kira platforma

    const Iyzipay = (await import('iyzipay')).default as any;
    const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

    const requestPayload: any = {
      locale: 'tr',
      conversationId: String(Date.now()),
      price: String(tenantTotal),
      paidPrice: String(tenantTotal),
      currency: 'TRY',
      basketId: `${contractId}:DEPOSIT`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: decoded.uid,
        name: decoded.name || callerEmail || 'Kiracı',
        surname: 'Kiracı',
        email: callerEmail || 'kiraci@ekira.com',
        identityNumber: '11111111111',
        registrationAddress: 'Türkiye',
        ip: '85.111.0.1',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: 'Kiracı', city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      billingAddress: { contactName: 'Kiracı', city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      basketItems: [
        {
          id: `DEPOSIT_${contractId}`,
          name: 'Depozito',
          category1: 'Depozito',
          itemType: 'VIRTUAL',
          price: String(tenantTotal),
        },
      ],
    };

    try {
      const iyziRes = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(requestPayload, (err: any, result: any) => {
          if (err) reject(err); else resolve(result);
        });
      });

      if (!iyziRes || iyziRes.status !== 'success') {
        res.status(500).json({ error: 'iyzico checkout oluşturulamadı.', detail: iyziRes }); return;
      }

      // Store deposit checkout info in a standalone_payments subcollection
      await admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/standalone_payments/deposit`).set({
        type: 'DEPOSIT',
        depositBase,
        tenantTotal,
        landlordNet,
        agentRevenue,
        platformRevenue,
        status: 'PAYMENT_PENDING',
        iyzico: {
          checkoutToken: iyziRes.token,
          lastInitAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        contractId,
        ownerUid,
        createdBy: decoded.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.status(200).json({
        token: iyziRes.token,
        checkoutFormContent: iyziRes.checkoutFormContent,
        paymentPageUrl: iyziRes.paymentPageUrl,
      });
    } catch (err: any) {
      console.error('createDepositCheckout error:', err?.message || err);
      res.status(500).json({ error: 'iyzico hatası', detail: err?.message || String(err) });
    }
  });
});

// ─── Admin: Refund a payment via iyzico API ───────────────────────────
const ADMIN_EMAIL = 'clk.ersinnn@gmail.com';

export const adminRefundPayment = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }
    if (decoded.email !== ADMIN_EMAIL) { res.status(403).json({ error: 'admin-only' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { ownerUid, contractId, invoiceId } = body || {};
    if (!ownerUid || !contractId || !invoiceId) {
      res.status(400).json({ error: 'ownerUid, contractId, invoiceId zorunludur.' }); return;
    }

    const invoiceRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) { res.status(404).json({ error: 'Invoice bulunamadı.' }); return; }
    const invoice = invoiceSnap.data() as any;

    if (invoice.status === 'REFUNDED') {
      res.status(400).json({ error: 'Bu fatura zaten iade edilmiş.' }); return;
    }
    if (invoice.status !== 'PAID') {
      res.status(400).json({ error: 'Sadece PAID durumundaki faturalar iade edilebilir.' }); return;
    }

    const paymentId = invoice.iyzico?.paymentId;
    if (!paymentId) {
      // No paymentId — try to get it from checkoutToken
      const checkoutToken = invoice.iyzico?.checkoutToken;
      if (!checkoutToken) {
        res.status(400).json({ error: 'iyzico paymentId veya checkoutToken bulunamadı.' }); return;
      }

      const apiKey = getEnv('IYZICO_API_KEY');
      const secretKey = getEnv('IYZICO_SECRET_KEY');
      const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
      if (!apiKey || !secretKey) { res.status(500).json({ error: 'iyzico env eksik.' }); return; }

      try {
        const Iyzipay = (await import('iyzipay')).default as any;
        const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

        // Retrieve paymentId from checkout token
        const formResult = await iyzicoRequest(iyzipay.checkoutForm.retrieve.bind(iyzipay.checkoutForm), {
          locale: 'tr', conversationId: String(Date.now()), token: checkoutToken
        });

        if (!formResult?.paymentId) {
          res.status(400).json({ error: 'iyzico paymentId alınamadı.' }); return;
        }

        // Save paymentId for future
        await invoiceRef.set({ iyzico: { paymentId: formResult.paymentId } }, { merge: true });
        invoice.iyzico.paymentId = formResult.paymentId;
      } catch (e: any) {
        res.status(500).json({ error: 'iyzico paymentId sorgulama hatası.', detail: e?.message }); return;
      }
    }

    // Now do the actual refund
    const apiKey = getEnv('IYZICO_API_KEY');
    const secretKey = getEnv('IYZICO_SECRET_KEY');
    const baseUrl = getEnv('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    if (!apiKey || !secretKey) { res.status(500).json({ error: 'iyzico env eksik.' }); return; }

    try {
      const Iyzipay = (await import('iyzipay')).default as any;
      const iyzipay = new Iyzipay({ apiKey, secretKey, uri: baseUrl });

      console.log('adminRefundPayment: retrieving payment', invoice.iyzico.paymentId);

      // First retrieve payment to get itemTransactions for refund
      const paymentResult = await iyzicoRequest(iyzipay.payment.retrieve.bind(iyzipay.payment), {
        locale: 'tr', conversationId: String(Date.now()), paymentId: invoice.iyzico.paymentId
      });

      console.log('adminRefundPayment: payment retrieve result status:', paymentResult?.status, 'items:', paymentResult?.itemTransactions?.length);

      if (!paymentResult?.itemTransactions?.length) {
        res.status(400).json({ error: 'iyzico ödeme detayları alınamadı.', detail: paymentResult }); return;
      }

      // Refund each item transaction
      const refundResults: any[] = [];
      for (const item of paymentResult.itemTransactions) {
        console.log('adminRefundPayment: refunding item', item.paymentTransactionId, 'price:', item.paidPrice);
        try {
          const refundResult = await iyzicoRequest(iyzipay.refund.create.bind(iyzipay.refund), {
            locale: 'tr',
            conversationId: `refund-${invoiceId}-${Date.now()}`,
            paymentTransactionId: item.paymentTransactionId,
            price: String(item.paidPrice),
            currency: 'TRY',
            ip: '85.111.0.1',
          });
          console.log('adminRefundPayment: refund result:', JSON.stringify(refundResult));
          refundResults.push(refundResult);
        } catch (refundErr: any) {
          console.error('adminRefundPayment: refund item error:', refundErr?.message || refundErr);
          refundResults.push({ status: 'failure', errorMessage: refundErr?.message || String(refundErr) });
        }
      }

      const allSuccess = refundResults.every((r) => r?.status === 'success');

      // Even if iyzico refund fails, allow admin to force-mark as REFUNDED
      // Update invoice status to REFUNDED
      await invoiceRef.set({
        status: 'REFUNDED',
        paidAt: null,
        payoutPlanned: false,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundedBy: decoded.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Delete payout
      try {
        await admin.firestore().doc(`accounts/${ownerUid}/payouts/${invoiceId}`).delete();
      } catch (_) { /* payout may not exist */ }

      // Notify tenant
      try {
        const contractSnap = await admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}`).get();
        const contract = contractSnap.data() as any;
        if (contract?.tenant?.email) {
          const tenantQuery = await admin.firestore().collectionGroup('members').where('email', '==', contract.tenant.email).limit(1).get();
          if (!tenantQuery.empty) {
            const tenantUid = tenantQuery.docs[0].ref.parent.parent?.id;
            if (tenantUid) {
              await createNotification(tenantUid, 'system', 'Ödeme İade Edildi',
                `${invoice.period || ''} dönemi ödemeniz iade edildi. Tekrar ödeme yapmanız gerekmektedir.`,
                '/invoices');
            }
          }
        }
      } catch (notifErr: any) {
        console.error('adminRefundPayment: notification error:', notifErr?.message);
      }

      if (allSuccess) {
        res.status(200).json({ success: true, status: 'REFUNDED', refundResults });
      } else {
        // Refund partially failed at iyzico but we still marked as REFUNDED in Firestore
        res.status(200).json({ success: true, status: 'REFUNDED', warning: 'iyzico iade kısmen başarısız olabilir, fatura durumu REFUNDED olarak güncellendi.', refundResults });
      }
    } catch (err: any) {
      console.error('adminRefundPayment error:', err?.message || err, err?.stack);
      res.status(500).json({ error: 'iyzico iade hatası.', detail: err?.message });
    }
  });
});

// ─── Admin: Update invoice status manually ────────────────────────────
export const adminUpdateInvoiceStatus = onRequest({ region: 'us-central1' }, async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const authHeader = req.headers.authorization || '';
    const tokenStr = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!tokenStr) { res.status(401).json({ error: 'auth-required' }); return; }

    let decoded: admin.auth.DecodedIdToken;
    try { decoded = await admin.auth().verifyIdToken(tokenStr); } catch { res.status(401).json({ error: 'invalid-token' }); return; }
    if (decoded.email !== ADMIN_EMAIL) { res.status(403).json({ error: 'admin-only' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { ownerUid, contractId, invoiceId, newStatus } = body || {};
    const validStatuses = ['DUE', 'OVERDUE', 'PAID', 'PAYMENT_PENDING', 'FAILED', 'REFUNDED', 'CLOSED_UPFRONT'];
    if (!ownerUid || !contractId || !invoiceId || !newStatus) {
      res.status(400).json({ error: 'ownerUid, contractId, invoiceId, newStatus zorunludur.' }); return;
    }
    if (!validStatuses.includes(newStatus)) {
      res.status(400).json({ error: `Geçersiz durum. Geçerli: ${validStatuses.join(', ')}` }); return;
    }

    const invoiceRef = admin.firestore().doc(`accounts/${ownerUid}/contracts/${contractId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) { res.status(404).json({ error: 'Invoice bulunamadı.' }); return; }

    const updateData: any = {
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: decoded.uid,
    };

    if (newStatus === 'PAID') {
      updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (newStatus === 'REFUNDED') {
      updateData.paidAt = null;
      updateData.payoutPlanned = false;
      updateData.refundedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await invoiceRef.set(updateData, { merge: true });

    // If changing to REFUNDED, also delete payout
    if (newStatus === 'REFUNDED') {
      try {
        await admin.firestore().doc(`accounts/${ownerUid}/payouts/${invoiceId}`).delete();
      } catch (_) { /* payout may not exist */ }
    }

    res.status(200).json({ success: true, status: newStatus });
  });
});
