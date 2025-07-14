// Script to create TEKNO25 promo code in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createPromoCode() {
  try {
    const promoCodeData = {
      code: 'TEKNO25',
      discountType: 'percentage',
      discountValue: 100, // 100% discount (free)
      validFrom: new Date('2024-01-01').toISOString(),
      validUntil: new Date('2025-12-31').toISOString(),
      usageLimit: 1000, // Allow 1000 uses
      usedCount: 0,
      isActive: true,
      applicablePlans: ['monthly', 'yearly']
    };

    const docRef = await addDoc(collection(db, 'promo-codes'), promoCodeData);
    console.log('Promo code created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating promo code:', error);
  }
}

createPromoCode();