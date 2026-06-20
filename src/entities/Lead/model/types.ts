export type LeadStatus = 'новый' | 'отправлено' | 'ответил' | 'не ответил';

export interface Lead {
  id: string;
  text: string;
  group: string;
  date: string | null;
  link: string | null;
  author: string | null;
  comment: string;
  status: LeadStatus;
  category: string;
  products: string;
}
