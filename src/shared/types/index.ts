export type TAny = any

/** Тип собеседника в чате: покупатель (лид) или продавец. */
export type ContactKind = 'buyer' | 'seller';

/**
 * Единая модель собеседника для чата — объединяет Lead (покупатель) и Seller
 * (продавец) в одну форму. Живёт в shared (без импортов из entities), чтобы её
 * могли использовать и виджеты, и страницы. Маппинг Lead/Seller → ChatContact
 * делают страницы (они могут импортировать entities).
 */
export interface ChatContact {
  id: string;
  author: string | null;
  text: string;
  group: string;
  date: string | null;
  link: string | null;
  comment: string;
  category: string;
  products: string;
  /** покупатель / продавец */
  kind: ContactKind;
  /** строковый статус (у лида и продавца разные наборы) */
  status: string;
  /** только у покупателя */
  region?: string;
  /** только у продавца — работает оптом */
  wholesale?: boolean;
}
