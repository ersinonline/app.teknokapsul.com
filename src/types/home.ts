export interface Home {
  id: string;
  userId: string;
  address: string;
  type: 'rental' | 'owned';
  rentAmount?: number;
  rentDueDay?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  documents: {
    contract?: string; // PDF URL
    bills?: string[]; // PDF URLs
  };
  notes?: string;
  createdAt: string;
}

export interface HomeFormData {
  address: string;
  type: 'rental' | 'owned';
  rentAmount?: number;
  rentDueDay?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}