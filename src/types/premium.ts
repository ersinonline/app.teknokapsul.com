export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PremiumSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  promoCode?: string;
  discountAmount?: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PremiumUser {
  userId: string;
  isPremium: boolean;
  subscriptionId?: string;
  premiumStartDate?: Date;
  premiumEndDate?: Date;
  features: PremiumFeature[];
  status?: 'active' | 'inactive' | 'cancelled' | 'expired';
  cancellationStatus?: 'active' | 'cancelled';
  cancellationDate?: Date;
  restoreDeadline?: Date;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicablePlans: string[];
}

export interface PremiumFormData {
  planId: string;
  paymentMethod: string;
  promoCode?: string;
  autoRenew: boolean;
}

export const PREMIUM_FEATURES = {
  REAL_TIME_EXCHANGE_RATES: 'real_time_exchange_rates',
  CARGO_TRACKING: 'cargo_tracking',
  EMAIL_REMINDERS: 'email_reminders',
  VIP_SUPPORT: 'vip_support',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  UNLIMITED_TRANSACTIONS: 'unlimited_transactions'
} as const;

export type PremiumFeatureType = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];