export interface Product {
  id: string;
  name: string;
  pricePaise: number; // Stored in paise (integer)
  regularPricePaise?: number;
  offerPricePaise?: number;
  stock: number;
  category: string;
  categoryId?: string;
  image: string;
  galleryImages?: string[];
  description?: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'red' | 'amber' | 'green';
  rating?: number;
  ratingCount?: number;
  isFavorite?: boolean;
  isActive?: boolean;
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
  customerId?: string;
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
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  membershipTier?: string; // 'Gold Member' | 'Silver Member' | 'Bronze Member'
  balancePaise?: number;
  balanceRupees?: number;
  ordersCount?: number;
  totalSpentPaise?: number;
  lastOrderDate?: string;
  createdAt?: string;
  status?: 'active' | 'inactive';
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export type LockerVisualState = 'available' | 'reserved' | 'occupied' | 'out_of_service';

export interface SmartLocker {
  id: string;
  number: string; // 'L-01' to 'L-12'
  name?: string;
  status: LockerVisualState;
  orderId?: string;
  orderNumber?: string;
  pickupStatus?: 'Awaiting Customer' | 'PIN Verified' | 'Dispensed' | 'Holding';
  temperatureC?: number;
  assignedAt?: string;
  expiresInSeconds?: number;
  doorState: 'locked' | 'unlocked' | 'open';
}

export type AdminLocker = SmartLocker;

