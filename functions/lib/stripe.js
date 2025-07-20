"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.reactivateStripeSubscription = exports.createCustomerPortalSession = exports.cancelStripeSubscription = exports.verifySession = exports.createCheckoutSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const params_1 = require("firebase-functions/params");
const stripe_1 = require("stripe");
// Initialize Firebase Admin SDK
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const stripe = new stripe_1.default(stripeSecretKey.value());
// CORS helper function
const setCorsHeaders = (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
};
// Create Checkout Session
exports.createCheckoutSession = (0, https_1.onRequest)({ cors: true, secrets: [stripeSecretKey] }, async (request, response) => {
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { productId, userId, customerEmail, successUrl, cancelUrl, } = request.body;
        if (!productId || !userId || !successUrl || !cancelUrl) {
            response.status(400).json({ error: 'Missing required parameters' });
            return;
        }
        // Create Stripe checkout session
        let sessionConfig = {
            payment_method_types: ['card', 'googlepay', 'applepay'],
            customer_email: customerEmail,
            metadata: {
                userId,
                productId,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
        };
        // Check if this is for cashback offer, order payment, or premium subscription
        if (productId === 'cashback_offer') {
            // For cashback offers, use payment mode with custom amount
            const amount = request.body.amount || 5000; // Default 50 TL if not specified
            sessionConfig = Object.assign(Object.assign({}, sessionConfig), { mode: 'payment', line_items: [
                    {
                        price_data: {
                            currency: 'try',
                            product_data: {
                                name: 'Harcadıkça Kazan - Alışveriş',
                                description: 'Cashback kazanmak için alışveriş ödemesi',
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ] });
        }
        else if (productId === 'order_payment') {
            // For order payments, use payment mode with custom amount
            const amount = request.body.amount || 5000; // Amount from cart total
            sessionConfig = Object.assign(Object.assign({}, sessionConfig), { mode: 'payment', line_items: [
                    {
                        price_data: {
                            currency: 'try',
                            product_data: {
                                name: 'Sipariş Ödemesi',
                                description: 'Alışveriş sepeti ödemesi',
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ] });
        }
        else {
            // For premium subscription
            sessionConfig = Object.assign(Object.assign({}, sessionConfig), { mode: 'subscription', line_items: [
                    {
                        price_data: {
                            currency: 'try',
                            product_data: {
                                name: 'Premium Abonelik',
                                description: 'Aylık premium abonelik',
                            },
                            unit_amount: 2999,
                            recurring: {
                                interval: 'month',
                            },
                        },
                        quantity: 1,
                    },
                ] });
        }
        const session = await stripe.checkout.sessions.create(sessionConfig);
        response.json({
            id: session.id,
            url: session.url,
        });
    }
    catch (error) {
        v2_1.logger.error('Error creating checkout session:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});
// Verify Session
exports.verifySession = (0, https_1.onRequest)({ cors: true, secrets: [stripeSecretKey] }, async (request, response) => {
    var _a, _b, _c, _d, _e;
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const sessionId = request.query.sessionId;
        if (!sessionId) {
            response.status(400).json({ error: 'Session ID is required' });
            return;
        }
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'customer'],
        });
        // Verify product ID (allow multiple product types)
        const validProductIds = ['prod_SgrNWIaODU87Cq', 'cashback_offer', 'order_payment'];
        if (!validProductIds.includes(((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.productId) || '')) {
            response.status(400).json({ error: 'Invalid product' });
            return;
        }
        response.json({
            sessionId: session.id,
            paymentStatus: session.payment_status,
            userId: (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.userId,
            productId: (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.productId,
            subscriptionId: typeof session.subscription === 'string'
                ? session.subscription
                : (_d = session.subscription) === null || _d === void 0 ? void 0 : _d.id,
            customerId: typeof session.customer === 'string'
                ? session.customer
                : (_e = session.customer) === null || _e === void 0 ? void 0 : _e.id,
            customerEmail: session.customer_email,
            amountTotal: session.amount_total,
            currency: session.currency,
        });
    }
    catch (error) {
        v2_1.logger.error('Error verifying session:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});
// Cancel Stripe subscription
exports.cancelStripeSubscription = (0, https_1.onRequest)({ cors: true, secrets: [stripeSecretKey] }, async (request, response) => {
    var _a;
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { subscriptionId, userId } = request.body;
        if (!subscriptionId || !userId) {
            response.status(400).json({ error: 'Subscription ID and User ID are required' });
            return;
        }
        // Get subscription to verify it belongs to the user
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (((_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
            response.status(403).json({ error: 'Subscription does not belong to user' });
            return;
        }
        // Cancel the subscription at period end
        const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
            metadata: Object.assign(Object.assign({}, subscription.metadata), { cancellation_reason: 'user_requested', cancelled_at: new Date().toISOString() })
        });
        v2_1.logger.info(`Subscription cancelled for user: ${userId}, subscription: ${subscriptionId}`);
        response.json({
            success: true,
            subscription: {
                id: cancelledSubscription.id,
                status: cancelledSubscription.status,
                cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
                current_period_end: cancelledSubscription.current_period_end
            }
        });
    }
    catch (error) {
        v2_1.logger.error('Error cancelling subscription:', error);
        response.status(500).json({ error: 'Failed to cancel subscription' });
    }
});
// Reactivate cancelled subscription
// Create Customer Portal Session
exports.createCustomerPortalSession = (0, https_1.onRequest)({ cors: true, secrets: [stripeSecretKey] }, async (request, response) => {
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { customerId, returnUrl } = request.body;
        if (!customerId || !returnUrl) {
            response.status(400).json({ error: 'Customer ID and return URL are required' });
            return;
        }
        // Create customer portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        response.json({
            url: portalSession.url,
        });
    }
    catch (error) {
        v2_1.logger.error('Error creating customer portal session:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});
exports.reactivateStripeSubscription = (0, https_1.onRequest)({ cors: true, secrets: [stripeSecretKey] }, async (request, response) => {
    var _a;
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { subscriptionId, userId } = request.body;
        if (!subscriptionId || !userId) {
            response.status(400).json({ error: 'Subscription ID and User ID are required' });
            return;
        }
        // Get subscription to verify it belongs to the user
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (((_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
            response.status(403).json({ error: 'Subscription does not belong to user' });
            return;
        }
        // Reactivate the subscription
        const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
            metadata: Object.assign(Object.assign({}, subscription.metadata), { reactivated_at: new Date().toISOString() })
        });
        v2_1.logger.info(`Subscription reactivated for user: ${userId}, subscription: ${subscriptionId}`);
        response.json({
            success: true,
            subscription: {
                id: reactivatedSubscription.id,
                status: reactivatedSubscription.status,
                cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
                current_period_end: reactivatedSubscription.current_period_end
            }
        });
    }
    catch (error) {
        v2_1.logger.error('Error reactivating subscription:', error);
        response.status(500).json({ error: 'Failed to reactivate subscription' });
    }
});
// Stripe Webhook
exports.stripeWebhook = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    var _a, _b, _c, _d, _e;
    // Handle CORS
    setCorsHeaders(response);
    if (request.method === 'OPTIONS') {
        response.status(204).send('');
        return;
    }
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const sig = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        v2_1.logger.error('Webhook secret not configured');
        response.status(500).json({ error: 'Webhook secret not configured' });
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.rawBody || request.body, sig, webhookSecret);
    }
    catch (err) {
        v2_1.logger.error('Webhook signature verification failed:', err);
        response.status(400).json({ error: 'Webhook signature verification failed' });
        return;
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.productId) === 'prod_SgrNWIaODU87Cq') {
                    const userId = session.metadata.userId;
                    const subscriptionId = typeof session.subscription === 'string'
                        ? session.subscription
                        : (_b = session.subscription) === null || _b === void 0 ? void 0 : _b.id;
                    if (userId && subscriptionId) {
                        // Get subscription details to set end date
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        const startDate = new Date();
                        const endDate = new Date(subscription.current_period_end * 1000);
                        // Update subscription metadata with userId
                        await stripe.subscriptions.update(subscriptionId, {
                            metadata: {
                                userId: userId,
                                productId: 'prod_SgrNWIaODU87Cq'
                            }
                        });
                        // Define premium features
                        const premiumFeatures = [
                            {
                                id: 'real-time-exchange-rates',
                                name: 'Anlık Döviz Kurları',
                                description: 'Anlık değişen döviz, fon, hisse ve altın kurları',
                                isEnabled: true
                            },
                            {
                                id: 'cargo-tracking',
                                name: 'Kargo Takibi',
                                description: 'Direkt sitede kargo takibi',
                                isEnabled: true
                            },
                            {
                                id: 'email-reminders',
                                name: 'E-posta Hatırlatmaları',
                                description: 'Giderleri 3 gün önceden e-posta hatırlatması',
                                isEnabled: true
                            },
                            {
                                id: 'vip-support',
                                name: 'VIP Destek',
                                description: 'Ücretsiz VIP danışman hizmeti',
                                isEnabled: true
                            },
                            {
                                id: 'advanced-analytics',
                                name: 'Gelişmiş Analitik',
                                description: 'Gelişmiş analitik raporlar',
                                isEnabled: true
                            },
                            {
                                id: 'unlimited-transactions',
                                name: 'Sınırsız İşlem',
                                description: 'Sınırsız işlem kaydı',
                                isEnabled: true
                            }
                        ];
                        // Update user premium status with complete data
                        await db.collection('teknokapsul').doc(userId)
                            .collection('premium').doc('status').set({
                            userId,
                            isPremium: true,
                            subscriptionId,
                            customerId: session.customer,
                            premiumStartDate: startDate.toISOString(),
                            premiumEndDate: endDate.toISOString(),
                            features: premiumFeatures,
                            subscriptionStatus: 'active',
                            updatedAt: new Date().toISOString(),
                        }, { merge: true });
                        // Also create subscription record
                        await db.collection('premium-subscriptions').doc(subscriptionId).set({
                            userId,
                            planId: 'premium-monthly',
                            status: 'active',
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            autoRenew: true,
                            paymentMethod: 'credit_card',
                            totalAmount: 2999,
                            stripeSubscriptionId: subscriptionId,
                            stripeCustomerId: session.customer,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }, { merge: true });
                        v2_1.logger.info(`Premium activated for user: ${userId}, end date: ${endDate.toISOString()}`);
                    }
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;
                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const userId = (_c = subscription.metadata) === null || _c === void 0 ? void 0 : _c.userId;
                    if (userId) {
                        const endDate = new Date(subscription.current_period_end * 1000);
                        await db.collection('teknokapsul').doc(userId)
                            .collection('premium').doc('status').update({
                            isPremium: true,
                            premiumEndDate: endDate.toISOString(),
                            updatedAt: new Date().toISOString(),
                        });
                        v2_1.logger.info(`Premium renewed for user: ${userId}`);
                    }
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const userId = (_d = subscription.metadata) === null || _d === void 0 ? void 0 : _d.userId;
                if (userId) {
                    const isActive = subscription.status === 'active';
                    const endDate = new Date(subscription.current_period_end * 1000);
                    const isCancelledAtPeriodEnd = subscription.cancel_at_period_end;
                    // Update premium status
                    await db.collection('teknokapsul').doc(userId)
                        .collection('premium').doc('status').update({
                        isPremium: isActive,
                        premiumEndDate: endDate.toISOString(),
                        subscriptionStatus: subscription.status,
                        cancellationStatus: isCancelledAtPeriodEnd ? 'cancelled' : null,
                        canRestore: isCancelledAtPeriodEnd,
                        updatedAt: new Date().toISOString(),
                    });
                    // Update subscription record
                    await db.collection('premium-subscriptions')
                        .where('stripeSubscriptionId', '==', subscription.id)
                        .get()
                        .then(querySnapshot => {
                        querySnapshot.forEach(doc => {
                            doc.ref.update({
                                status: isActive ? 'active' : 'cancelled',
                                autoRenew: !isCancelledAtPeriodEnd,
                                endDate: endDate.toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        });
                    });
                    // If cancelled at period end, create cancellation request
                    if (isCancelledAtPeriodEnd) {
                        await db.collection('premium-cancellation-requests').add({
                            userId: userId,
                            subscriptionId: subscription.id,
                            originalEndDate: endDate.toISOString(),
                            newEndDate: endDate.toISOString(),
                            requestDate: new Date().toISOString(),
                            status: 'pending',
                            canRestore: true,
                            restoreDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            source: 'stripe_webhook'
                        });
                    }
                    v2_1.logger.info(`Premium status updated for user: ${userId}, active: ${isActive}, cancelled_at_period_end: ${isCancelledAtPeriodEnd}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const userId = (_e = subscription.metadata) === null || _e === void 0 ? void 0 : _e.userId;
                if (userId) {
                    await db.collection('teknokapsul').doc(userId)
                        .collection('premium').doc('status').update({
                        isPremium: false,
                        subscriptionStatus: 'cancelled',
                        updatedAt: new Date().toISOString(),
                    });
                    v2_1.logger.info(`Premium cancelled for user: ${userId}`);
                }
                break;
            }
            default:
                v2_1.logger.info(`Unhandled event type: ${event.type}`);
        }
        response.json({ received: true });
    }
    catch (error) {
        v2_1.logger.error('Error processing webhook:', error);
        response.status(500).json({ error: 'Webhook processing failed' });
    }
});
//# sourceMappingURL=stripe.js.map