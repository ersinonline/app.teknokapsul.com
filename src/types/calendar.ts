export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  type: 'event' | 'birthday' | 'reminder';
  createdAt: string;
}