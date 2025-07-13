import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shippingCost: number;
  grandTotal: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: any;
  shippingAddress: ShippingAddress;
  userId: string;
  userOrderId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const createOrder = async (userId: string, orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const orderWithMetadata = {
      ...orderData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Kullanıcının kendi orders koleksiyonuna ekle
    const userOrdersRef = collection(db, 'teknokapsul', userId, 'orders');
    const userDocRef = await addDoc(userOrdersRef, orderWithMetadata);
    
    // Global orders koleksiyonuna da ekle (admin paneli için)
    const globalOrdersRef = collection(db, 'orders');
    await addDoc(globalOrdersRef, {
      ...orderWithMetadata,
      userOrderId: userDocRef.id
    });
    
    console.log('Order created successfully:', userDocRef.id);
    return userDocRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'teknokapsul', userId, 'orders');
    const querySnapshot = await getDocs(ordersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (userId: string, orderId: string, status: Order['status']): Promise<void> => {
  try {
    const orderRef = doc(db, 'teknokapsul', userId, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Admin için tüm siparişleri getir
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};