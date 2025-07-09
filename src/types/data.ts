export type { Expense, ExpenseFormData } from './expense';

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
  category?: string;
  isShared?: boolean;
  sharedWithEmails?: string[];
}