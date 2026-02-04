export interface DownPayment {
  id: string;
  amount: number;
  description: string;
}

export interface AdditionalExpenseItem {
  id: string;
  amount: number;
  description: string;
}

export interface AdditionalExpenses {
  titleDeedFee: number;
  loanAllocationFee: number;
  appraisalFee: number;
  mortgageEstablishmentFee: number;
  daskInsurancePremium: number;
  revolvingFundFee: number;
  customExpenses: AdditionalExpenseItem[];
  total: number;
}

export interface MonthlyIncomeItem {
  id: string;
  amount: number;
  description: string;
}

export interface SelectedCredit {
  id: string;
  type: 'konut' | 'tasit' | 'ihtiyac';
  bankName: string;
  amount: number;
  monthlyPayment: number;
  totalPayment: number;
  term: number;
}

export interface PaymentPlan {
  id?: string;
  planId?: string;
  name: string;
  type: 'housing' | 'vehicle';
  price: number;
  downPayments: DownPayment[];
  housingCredit: SelectedCredit | null;
  personalCredits: SelectedCredit[];
  monthlyIncomes: MonthlyIncomeItem[];
  totalMonthlyPayment: number;
  additionalExpenses?: AdditionalExpenses;
  createdAt: any;
}
