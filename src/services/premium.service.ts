import { collection, doc, getDoc, setDoc, updateDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PremiumSubscription {
  id?: string;
  userId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  paymentId: string;
  amount: number;
  refundUsed: number; // Bu ay kullanılan iade tutarı
  refundLimit: number; // Aylık iade limiti (150 TL)
  createdAt: Date;
  updatedAt: Date;
}

export interface PremiumPaymentRecord {
  id?: string;
  userId: string;
  paymentId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  createdAt: Date;
}

const PREMIUM_PRICE = 49;
const PREMIUM_DURATION_DAYS = 30;
const MONTHLY_REFUND_LIMIT = 150;

// Kullanıcının premium durumunu kontrol et
export const checkPremiumStatus = async (userId: string): Promise<PremiumSubscription | null> => {
  try {
    const premiumRef = doc(db, 'teknokapsul', userId, 'premium', 'subscription');
    const premiumDoc = await getDoc(premiumRef);

    if (!premiumDoc.exists()) return null;

    const data = premiumDoc.data();
    const subscription: PremiumSubscription = {
      userId: data.userId,
      status: data.status,
      startDate: data.startDate?.toDate?.() || new Date(data.startDate),
      endDate: data.endDate?.toDate?.() || new Date(data.endDate),
      paymentId: data.paymentId,
      amount: data.amount,
      refundUsed: data.refundUsed || 0,
      refundLimit: data.refundLimit || MONTHLY_REFUND_LIMIT,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    };

    // Süre dolmuş mu kontrol et
    const now = new Date();
    if (subscription.status === 'active' && subscription.endDate < now) {
      // Abonelik süresi dolmuş, durumu güncelle
      await updateDoc(premiumRef, {
        status: 'expired',
        updatedAt: new Date()
      });
      subscription.status = 'expired';
    }

    return subscription;
  } catch (error) {
    console.error('Premium durum kontrolü hatası:', error);
    return null;
  }
};

// Premium abonelik başlat
export const activatePremium = async (
  userId: string,
  paymentId: string
): Promise<PremiumSubscription> => {
  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + PREMIUM_DURATION_DAYS);

    const subscription: Omit<PremiumSubscription, 'id'> = {
      userId,
      status: 'active',
      startDate: now,
      endDate,
      paymentId,
      amount: PREMIUM_PRICE,
      refundUsed: 0,
      refundLimit: MONTHLY_REFUND_LIMIT,
      createdAt: now,
      updatedAt: now,
    };

    const premiumRef = doc(db, 'teknokapsul', userId, 'premium', 'subscription');
    await setDoc(premiumRef, subscription);

    // Ödeme kaydını da tut
    const paymentRef = doc(collection(db, 'teknokapsul', userId, 'premium-payments'));
    await setDoc(paymentRef, {
      userId,
      paymentId,
      amount: PREMIUM_PRICE,
      status: 'success',
      createdAt: now,
    });

    // Global premium kayıtlarına da ekle (admin paneli için)
    const globalRef = doc(collection(db, 'premium-subscriptions'));
    await setDoc(globalRef, {
      userId,
      paymentId,
      amount: PREMIUM_PRICE,
      status: 'active',
      startDate: now,
      endDate,
      createdAt: now,
    });

    return subscription;
  } catch (error) {
    console.error('Premium aktivasyon hatası:', error);
    throw error;
  }
};

// Premium iade kullanımını güncelle
export const usePremiumRefund = async (
  userId: string,
  amount: number
): Promise<{ success: boolean; remaining: number; message: string }> => {
  try {
    const subscription = await checkPremiumStatus(userId);
    if (!subscription || subscription.status !== 'active') {
      return { success: false, remaining: 0, message: 'Aktif premium aboneliğiniz bulunmuyor.' };
    }

    const newRefundUsed = subscription.refundUsed + amount;
    if (newRefundUsed > subscription.refundLimit) {
      const remaining = subscription.refundLimit - subscription.refundUsed;
      return {
        success: false,
        remaining,
        message: `Aylık iade limitiniz aşılıyor. Kalan iade hakkınız: ${remaining.toFixed(2)} TL`
      };
    }

    const premiumRef = doc(db, 'teknokapsul', userId, 'premium', 'subscription');
    await updateDoc(premiumRef, {
      refundUsed: newRefundUsed,
      updatedAt: new Date()
    });

    return {
      success: true,
      remaining: subscription.refundLimit - newRefundUsed,
      message: `İade başarılı. Kalan iade hakkınız: ${(subscription.refundLimit - newRefundUsed).toFixed(2)} TL`
    };
  } catch (error) {
    console.error('Premium iade hatası:', error);
    return { success: false, remaining: 0, message: 'İade işlemi sırasında hata oluştu.' };
  }
};

// Admin: Tüm premium abonelikleri getir
export const getAllPremiumSubscriptions = async (): Promise<any[]> => {
  try {
    const ref = collection(db, 'premium-subscriptions');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Premium abonelikler yüklenirken hata:', error);
    return [];
  }
};

// Kullanıcının premium olup olmadığını hızlıca kontrol et
export const isPremiumUser = async (userId: string): Promise<boolean> => {
  const subscription = await checkPremiumStatus(userId);
  return subscription?.status === 'active';
};

export const PREMIUM_CONFIG = {
  price: PREMIUM_PRICE,
  durationDays: PREMIUM_DURATION_DAYS,
  monthlyRefundLimit: MONTHLY_REFUND_LIMIT,
};
