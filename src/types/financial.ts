export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  cardNumber: string; // Son 4 hanesi
  limit: number;
  currentDebt: number;
  availableLimit: number;
  debtRatio: number; // Yüzde olarak
  statementDate: number; // Ayın kaçıncı günü
  dueDate: number; // Ayın kaçıncı günü
  minimumPayment: number;
  interestRate: number;
  annualFeeDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CashAdvanceAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string; // Son 4 hanesi
  limit: number;
  currentDebt: number;
  availableLimit: number;
  debtRatio: number; // Yüzde olarak
  interestRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  loanType: 'personal' | 'vehicle' | 'housing' | 'commercial' | 'other';
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  totalInstallments: number;
  remainingInstallments: number;
  startDate: Date;
  endDate: Date;
  nextPaymentDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  principal: number;
  interest: number;
  paymentDate: Date;
  installmentNumber: number;
  remainingBalance: number;
  createdAt: Date;
  userId: string;
}

export const LOAN_TYPES = {
  personal: 'Bireysel Kredi',
  vehicle: 'Taşıt Kredisi',
  housing: 'Konut Kredisi',
  commercial: 'Ticari Kredi',
  other: 'Diğer'
} as const;

export const BANKS = [
  'Türkiye İş Bankası',
  'Garanti BBVA',
  'Yapı Kredi',
  'Akbank',
  'Ziraat Bankası',
  'Halkbank',
  'VakıfBank',
  'Denizbank',
  'QNB Finansbank',
  'İNG Bank',
  'HSBC',
  'Şekerbank',
  'TEB',
  'Odeabank',
  'Diğer'
] as const;