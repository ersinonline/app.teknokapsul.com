export interface OrderProduct {
  amount: string;
  photoUrl: string;
  productName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
  deliveryAddress: string;
  trackingInfo?: string;
  trackingLink?: string;
  email: string;
  total: string;
  products: OrderProduct[];
}

export interface Application {
  id: string;
  type: string;
  status: string;
  date: string;
  details: string;
  email: string;
}

export interface Payment {
  id: string;
  amount: string;
  bank: string;
  date: string;
  description: string;
  installments: string;
  status: string;
  userId: string;
  isShared?: boolean;
  sharedWithEmails?: string[];
  originalAmount?: string;
}