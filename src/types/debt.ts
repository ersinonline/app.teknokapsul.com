export interface PersonalDebt {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dueDate: string;
  creditor: string;
  status: 'Ödenmedi' | 'Ödendi';
  notes?: string;
  createdAt: string;
}

export interface PersonalDebtFormData {
  description: string;
  amount: number;
  dueDate: string;
  creditor: string;
  notes?: string;
}