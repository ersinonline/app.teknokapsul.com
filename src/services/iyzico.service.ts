/**
 * İyzico Sanal Pos Entegrasyonu
 * 
 * NOT: İyzico API anahtarları backend'de tutulmalıdır.
 * Bu servis, frontend'den backend API'ye istek atar.
 * Şimdilik Firebase Cloud Functions veya bir API endpoint kullanılacak.
 * 
 * Sandbox test için: https://sandbox-api.iyzipay.com
 * Production için: https://api.iyzipay.com
 */

export interface IyzicoPaymentRequest {
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: string;
  }>;
}

export interface IyzicoPaymentResult {
  status: string;
  locale: string;
  systemTime: number;
  conversationId: string;
  token?: string;
  checkoutFormContent?: string;
  tokenExpireTime?: number;
  paymentPageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentId?: string;
}

const IYZICO_API_BASE = import.meta.env.VITE_IYZICO_API_URL || '/api/iyzico';

// Ödeme formu başlat (Checkout Form - 3D Secure)
export const initializeCheckoutForm = async (
  userId: string,
  productId: string,
  productName: string,
  productCategory: string,
  price: number,
  buyerInfo: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    city?: string;
    address?: string;
  }
): Promise<IyzicoPaymentResult> => {
  try {
    const response = await fetch(`${IYZICO_API_BASE}/checkout/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        productId,
        productName,
        productCategory,
        price: price.toFixed(2),
        paidPrice: price.toFixed(2),
        currency: 'TRY',
        buyer: {
          id: userId,
          name: buyerInfo.name || 'Kullanıcı',
          surname: buyerInfo.surname || 'TeknoKapsül',
          email: buyerInfo.email,
          identityNumber: '11111111111',
          registrationAddress: buyerInfo.address || 'İstanbul, Türkiye',
          ip: '85.34.78.112',
          city: buyerInfo.city || 'Istanbul',
          country: 'Turkey'
        },
        billingAddress: {
          contactName: `${buyerInfo.name || 'Kullanıcı'} ${buyerInfo.surname || 'TeknoKapsül'}`,
          city: buyerInfo.city || 'Istanbul',
          country: 'Turkey',
          address: buyerInfo.address || 'İstanbul, Türkiye'
        },
        basketItems: [{
          id: productId,
          name: productName,
          category1: productCategory,
          itemType: 'VIRTUAL',
          price: price.toFixed(2)
        }],
        callbackUrl: `${window.location.origin}/dijital-kodlar/odeme-sonuc`
      })
    });

    if (!response.ok) {
      throw new Error('İyzico API hatası');
    }

    return await response.json();
  } catch (error) {
    console.error('İyzico checkout initialize error:', error);
    throw error;
  }
};

// Ödeme sonucunu doğrula
export const verifyPayment = async (token: string): Promise<IyzicoPaymentResult> => {
  try {
    const response = await fetch(`${IYZICO_API_BASE}/checkout/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('İyzico doğrulama hatası');
    }

    return await response.json();
  } catch (error) {
    console.error('İyzico payment verify error:', error);
    throw error;
  }
};

// Simüle edilmiş ödeme (test/demo modu - iyzico backend hazır olana kadar)
export const simulatePayment = async (
  _userId: string,
  _productId: string,
  _productName: string,
  _price: number
): Promise<{ success: boolean; paymentId: string }> => {
  // Demo modda direkt başarılı döner
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    }, 1500);
  });
};
