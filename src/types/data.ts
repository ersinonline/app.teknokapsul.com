import { CategoryType } from './budget';
export type { Expense, ExpenseFormData } from './expense';

export interface OrderProduct {
  amount: string;
  photoUrl: string;
  productName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
  deliveryAddress: string;
  trackingInfo?: string;
  trackingLink?: string;
  email: string;
  total: string;
  products: OrderProduct[];
}

export interface Application {
  id: string;
  type: string;
  status: string;
  date: string;
  details: string;
  email: string;
}

export interface PaymentInstallment {
  current: number;
  total: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  title: string;
  description?: string;
  bank?: string;
  status: string;
  userId: string;
  type?: 'installment' | 'regular';
  installment?: PaymentInstallment;
  createdAt: string;
  category?: CategoryType;
  isShared?: boolean;
  sharedWithEmails?: string[];
}