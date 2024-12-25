export interface LoyaltyPoints {
  totalPoints: number;
  history: LoyaltyHistory[];
}

export interface LoyaltyHistory {
  date: string;
  action: string;
  points: number;
}

export type LoyaltyAction = 
  | 'APPLICATION_APPROVED'
  | 'ORDER_PLACED'
  | 'SUBSCRIPTION_ADDED'
  | 'PAYMENT_ADDED'
  | 'PAYMENT_COMPLETED'
  | 'EVENT_ADDED'
  | 'NOTE_ADDED';

export const POINT_VALUES: Record<LoyaltyAction, number> = {
  APPLICATION_APPROVED: 20,
  ORDER_PLACED: 50,
  SUBSCRIPTION_ADDED: 10,
  PAYMENT_ADDED: 5,
  PAYMENT_COMPLETED: 10,
  EVENT_ADDED: 3,
  NOTE_ADDED: 2
};