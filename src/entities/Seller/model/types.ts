export type SellerStatus = 'новый' | 'в работе' | 'готово';

export interface Seller {
  id: string;
  text: string;
  group: string;
  product: string;
  date: string | null;
  link: string | null;
  author: string | null;
  comment: string;
  status: SellerStatus;
}
