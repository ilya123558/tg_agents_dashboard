import type { Lead } from '@/entities/Lead';
import type { Seller } from '@/entities/Seller';
import type { ChatContact } from '@/shared/types';

/** Лид (покупатель) → единый контакт чата. */
export const leadToContact = (l: Lead): ChatContact => ({
  id: l.id,
  author: l.author,
  text: l.text,
  group: l.group,
  date: l.date,
  link: l.link,
  comment: l.comment,
  category: l.category,
  products: l.products,
  kind: 'buyer',
  status: l.status,
  region: l.region,
});

/** Продавец → единый контакт чата. */
export const sellerToContact = (s: Seller): ChatContact => ({
  id: s.id,
  author: s.author,
  text: s.text,
  group: s.group,
  date: s.date,
  link: s.link,
  comment: s.comment,
  category: s.category,
  products: s.products,
  kind: 'seller',
  status: s.status,
  wholesale: s.wholesale,
});
