export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  userId: string;
}

export interface SubscriptionFormData {
  name: string;
  endDate: string;
}