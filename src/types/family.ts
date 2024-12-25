export interface FamilyInvitation {
  id: string;
  familyId: string;
  senderEmail: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  totalDebt?: number;
  sharedExpenses?: boolean;
}