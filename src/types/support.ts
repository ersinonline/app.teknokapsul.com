export interface SupportTicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  name: string;
  email: string;
  userId?: string;
  attachments?: string[];
  replies?: SupportTicketReply[];
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
  resolution?: string;
}

export interface SupportTicketFormData {
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  email: string;
  name: string;
  phone?: string;
}

export const SUPPORT_CATEGORIES = {
  technical: 'Teknik Destek',
  billing: 'Faturalama',
  general: 'Genel Sorular',
  feature_request: 'Özellik İsteği',
  bug_report: 'Hata Bildirimi'
} as const;

export const SUPPORT_PRIORITIES = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil'
} as const;

export const SUPPORT_STATUSES = {
  open: 'Açık',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
  closed: 'Kapatıldı'
} as const;