import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe public key - bu değeri .env dosyasından alın
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Stripe instance
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

// Premium checkout interface ve fonksiyonları kaldırıldı

// Stripe Checkout'a yönlendir
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe yüklenemedi');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe redirect error:', error);
      throw new Error('Ödeme sayfasına yönlendirilemedi');
    }
  } catch (error) {
    console.error('Redirect to checkout error:', error);
    throw error;
  }
};

// Premium checkout fonksiyonu kaldırıldı

// Webhook için session doğrulama
export const verifyCheckoutSession = async (sessionId: string): Promise<any> => {
  try {
    const response = await fetch(`https://us-central1-superapp-37db4.cloudfunctions.net/verifySession?sessionId=${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Session doğrulanamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Session verification error:', error);
    throw error;
  }
};

// Cancel Stripe subscription
export const cancelStripeSubscription = async (subscriptionId: string, userId: string): Promise<any> => {
  try {
    const response = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/cancelStripeSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        userId
      }),
    });

    if (!response.ok) {
      throw new Error('Abonelik iptal edilemedi');
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe subscription cancellation error:', error);
    throw new Error('Abonelik iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.');
  }
};

// Reactivate Stripe subscription
export const reactivateStripeSubscription = async (subscriptionId: string, userId: string): Promise<any> => {
  try {
    const response = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/reactivateStripeSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        userId
      }),
    });

    if (!response.ok) {
      throw new Error('Abonelik geri alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe subscription reactivation error:', error);
    throw new Error('Abonelik geri alınırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
};

// Create Stripe Customer Portal Session for subscription management
export const createCustomerPortalSession = async (customerId: string, returnUrl?: string): Promise<{ url: string }> => {
  try {
    const response = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/createCustomerPortalSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: returnUrl || window.location.origin
      }),
    });

    if (!response.ok) {
      throw new Error('Müşteri portalı oluşturulamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Customer portal creation error:', error);
    throw new Error('Müşteri portalına erişim sağlanamadı. Lütfen tekrar deneyin.');
  }
};

// Redirect to Stripe Customer Portal or fallback URL
export const redirectToCustomerPortal = async (customerId?: string): Promise<void> => {
  try {
    if (customerId) {
      const portal = await createCustomerPortalSession(customerId);
      window.location.href = portal.url;
    } else {
      // Fallback to direct Stripe billing portal
      window.location.href = 'https://billing.stripe.com/p/login/7sY6oGezng7111XcFh24000';
    }
  } catch (error) {
    console.error('Portal redirect error:', error);
    // Fallback to direct Stripe billing portal
    window.location.href = 'https://billing.stripe.com/p/login/7sY6oGezng7111XcFh24000';
  }
};

export default getStripe;