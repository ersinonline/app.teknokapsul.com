export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  userId: string;
  autoRenew: boolean;
  renewalDay?: number;
  price: number;
  isActive: boolean;
  lastRenewalDate?: string;
}

export interface SubscriptionFormData {
  name: string;
  endDate?: string;
  autoRenew: boolean;
  renewalDay?: number;
  price: number;
  isActive: boolean;
}