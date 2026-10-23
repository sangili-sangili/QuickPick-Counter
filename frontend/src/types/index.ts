export interface Product {
  id: string;
  name: string;
  pricePaise: number; // Stored in paise (integer)
  stock: number;
  category: 'Snacks' | 'Drinks' | 'Chocolates' | 'Biscuits' | 'Combos' | 'Others';
  image: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'red' | 'amber' | 'green';
  rating?: number;
  ratingCount?: number;
  isFavorite?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'unpaid' | 'paid' | 'expired' | 'needs_review' | 'claimed';

export interface OrderTimelineEvent {
  title: string;
  time: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  totalPaise: number;
  status: OrderStatus;
  lockerNumber?: string;
  createdAt: string;
  expiresInSeconds: number;
  expiresAt: number; // Timestamp in ms
  timeline?: OrderTimelineEvent[];
}

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export type ScreenState = 'catalog' | 'view_all' | 'payment' | 'success';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  membershipTier?: string;
}
