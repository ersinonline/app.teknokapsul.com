import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DigitalCode {
  id?: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface DigitalOrder {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  productCategory: string;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  paymentMethod: string;
  code?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Admin: Dijital ürün ekle
export const addDigitalCode = async (product: Omit<DigitalCode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'digitalCodes'), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding digital code:', error);
    throw error;
  }
};

// Admin: Dijital ürün güncelle
export const updateDigitalCode = async (id: string, data: Partial<DigitalCode>): Promise<void> => {
  try {
    const ref = doc(db, 'digitalCodes', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error updating digital code:', error);
    throw error;
  }
};

// Admin: Dijital ürün sil
export const deleteDigitalCode = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'digitalCodes', id));
  } catch (error) {
    console.error('Error deleting digital code:', error);
    throw error;
  }
};

// Tüm aktif dijital ürünleri getir
export const getDigitalCodes = async (): Promise<DigitalCode[]> => {
  try {
    const q = query(collection(db, 'digitalCodes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalCode));
  } catch (error) {
    console.error('Error getting digital codes:', error);
    throw error;
  }
};

// Aktif dijital ürünleri getir (kullanıcılar için)
export const getActiveDigitalCodes = async (): Promise<DigitalCode[]> => {
  try {
    const q = query(collection(db, 'digitalCodes'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalCode));
  } catch (error) {
    console.error('Error getting active digital codes:', error);
    throw error;
  }
};

// Dijital sipariş oluştur
export const createDigitalOrder = async (order: Omit<DigitalOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'digitalOrders'), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    // Kullanıcının kendi koleksiyonuna da ekle
    await addDoc(collection(db, 'teknokapsul', order.userId, 'digitalOrders'), {
      ...order,
      globalOrderId: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating digital order:', error);
    throw error;
  }
};

// Kullanıcının dijital siparişlerini getir
export const getUserDigitalOrders = async (userId: string): Promise<DigitalOrder[]> => {
  try {
    const q = query(collection(db, 'teknokapsul', userId, 'digitalOrders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalOrder));
  } catch (error) {
    console.error('Error getting user digital orders:', error);
    throw error;
  }
};

// Admin: Tüm dijital siparişleri getir
export const getAllDigitalOrders = async (): Promise<DigitalOrder[]> => {
  try {
    const q = query(collection(db, 'digitalOrders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalOrder));
  } catch (error) {
    console.error('Error getting all digital orders:', error);
    throw error;
  }
};

// Dijital sipariş durumunu güncelle
export const updateDigitalOrderStatus = async (orderId: string, status: DigitalOrder['status'], code?: string): Promise<void> => {
  try {
    const ref = doc(db, 'digitalOrders', orderId);
    const updateData: any = { status, updatedAt: serverTimestamp() };
    if (code) updateData.code = code;
    await updateDoc(ref, updateData);
  } catch (error) {
    console.error('Error updating digital order status:', error);
    throw error;
  }
};
