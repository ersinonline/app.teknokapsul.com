export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  userId: string;
  price: number;
}

export interface SubscriptionFormData {
  name: string;
  endDate: string;
}