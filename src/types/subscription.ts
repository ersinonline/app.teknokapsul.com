export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  userId: string;
  autoRenew: boolean;
  renewalDay?: number;
  price: number;
}

export interface SubscriptionFormData {
  name: string;
  endDate?: string;
  renewalDay?: number;
  autoRenew: boolean;
  price: number;
}