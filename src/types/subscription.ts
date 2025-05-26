export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  userId: string;
  autoRenew: boolean;
  renewalDay?: number;
  price: number;
<<<<<<< HEAD
=======
  isActive: boolean;
  lastRenewalDate?: string;
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
}

export interface SubscriptionFormData {
  name: string;
  endDate?: string;
  renewalDay?: number;
  autoRenew: boolean;
  price: number;
<<<<<<< HEAD
=======
  isActive?: boolean;
>>>>>>> 8a8743f (Initial commit: Subscription management system with user-specific subscriptions and date handling improvements)
}