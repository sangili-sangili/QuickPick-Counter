import { Order, CategoryItem, SmartLocker } from '../types';
import { INITIAL_PRODUCTS } from './mockProducts';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat_1',
    name: 'Snacks',
    description: 'Crispy potato wafers, salted chips, and namkeen',
    image: '/images/lays.jpg',
    isActive: true,
    productCount: 14,
    createdAt: '2026-09-10',
  },
  {
    id: 'cat_2',
    name: 'Drinks',
    description: 'Sparkling sodas, chilled energy cans, and fruit beverages',
    image: '/images/coke.jpg',
    isActive: true,
    productCount: 8,
    createdAt: '2026-09-11',
  },
  {
    id: 'cat_3',
    name: 'Chocolates',
    description: 'Crisp wafer bars, rich milk chocolates, and sweet treats',
    image: '/images/kitkat.jpg',
    isActive: true,
    productCount: 6,
    createdAt: '2026-09-12',
  },
  {
    id: 'cat_4',
    name: 'Biscuits',
    description: 'Vanilla creme sandwich cookies and sweet crackers',
    image: '/images/oreo.jpg',
    isActive: true,
    productCount: 10,
    createdAt: '2026-09-12',
  },
  {
    id: 'cat_5',
    name: 'Combos',
    description: 'Value pack meal combos with beverage pairing',
    image: '/images/hero-snacks.jpg',
    isActive: true,
    productCount: 4,
    createdAt: '2026-09-14',
  },
  {
    id: 'cat_6',
    name: 'Healthy Snacks',
    description: 'Roasted nuts, baked multigrain chips, and protein bars',
    image: '/images/pringles.jpg',
    isActive: false,
    productCount: 2,
    createdAt: '2026-09-15',
  },
];

export const INITIAL_SMART_LOCKERS: SmartLocker[] = [
  { id: 'lock_1', number: 'L-01', name: 'L-01', status: 'available', doorState: 'locked', temperatureC: 21 },
  {
    id: 'lock_2',
    number: 'L-02',
    name: 'L-02',
    status: 'reserved',
    orderId: 'ord_1233',
    orderNumber: 'ORD1233',
    pickupStatus: 'Holding',
    assignedAt: '11:30 AM',
    expiresInSeconds: 40,
    doorState: 'locked',
    temperatureC: 20,
  },
  { id: 'lock_3', number: 'L-03', name: 'L-03', status: 'available', doorState: 'locked', temperatureC: 22 },
  { id: 'lock_4', number: 'L-04', name: 'L-04', status: 'available', doorState: 'locked', temperatureC: 21 },
  { id: 'lock_5', number: 'L-05', name: 'L-05', status: 'available', doorState: 'locked', temperatureC: 22 },
  { id: 'lock_6', number: 'L-06', name: 'L-06', status: 'available', doorState: 'locked', temperatureC: 20 },
  {
    id: 'lock_7',
    number: 'L-07',
    name: 'L-07',
    status: 'occupied',
    orderId: 'ord_1234',
    orderNumber: 'ORD1234',
    pickupStatus: 'Awaiting Customer',
    assignedAt: '11:32 AM',
    expiresInSeconds: 95,
    doorState: 'locked',
    temperatureC: 21,
  },
  {
    id: 'lock_8',
    number: 'L-08',
    name: 'L-08',
    status: 'occupied',
    orderId: 'ord_1230',
    orderNumber: 'ORD1230',
    pickupStatus: 'PIN Verified',
    assignedAt: '11:15 AM',
    doorState: 'unlocked',
    temperatureC: 21,
  },
  { id: 'lock_9', number: 'L-09', name: 'L-09', status: 'available', doorState: 'locked', temperatureC: 21 },
  { id: 'lock_10', number: 'L-10', name: 'L-10', status: 'available', doorState: 'locked', temperatureC: 22 },
  { id: 'lock_11', number: 'L-11', name: 'L-11', status: 'available', doorState: 'locked', temperatureC: 21 },
  {
    id: 'lock_12',
    number: 'L-12',
    name: 'L-12',
    status: 'out_of_service',
    doorState: 'locked',
    temperatureC: 25,
  },
];

export const INITIAL_LOCKERS = INITIAL_SMART_LOCKERS;
export type { AdminLocker } from '../types';


export const SAMPLE_ANALYTICS = {
  weeklyRevenue: [
    { day: 'Mon', revenue: 14200, orders: 48 },
    { day: 'Tue', revenue: 18500, orders: 62 },
    { day: 'Wed', revenue: 16800, orders: 55 },
    { day: 'Thu', revenue: 22400, orders: 74 },
    { day: 'Fri', revenue: 28900, orders: 98 },
    { day: 'Sat', revenue: 34500, orders: 122 },
    { day: 'Sun', revenue: 31200, orders: 110 },
  ],
  categoryPerformance: [
    { name: 'Snacks', percentage: 38, sales: 186 },
    { name: 'Drinks', percentage: 28, sales: 137 },
    { name: 'Chocolates', percentage: 18, sales: 88 },
    { name: 'Biscuits', percentage: 12, sales: 59 },
    { name: 'Combos', percentage: 4, sales: 20 },
  ],
  hourlyTraffic: [
    { hour: '8 AM', count: 12 },
    { hour: '10 AM', count: 28 },
    { hour: '12 PM', count: 64 },
    { hour: '2 PM', count: 42 },
    { hour: '4 PM', count: 58 },
    { hour: '6 PM', count: 86 },
    { hour: '8 PM', count: 52 },
  ],
};

export const INITIAL_ADMIN_ORDERS: Order[] = [
  {
    id: 'ord_1234',
    orderNumber: 'ORD1234',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 }, // Lay's ₹30
      { product: INITIAL_PRODUCTS[1], quantity: 2 }, // Coke ₹40 x 2 = ₹80
    ],
    totalPaise: 11000,
    status: 'paid',
    lockerNumber: 'L-07',
    createdAt: 'Today, 11:32 AM',
    expiresInSeconds: 120,
    expiresAt: Date.now() + 95000,
    timeline: [
      { title: 'Order Placed', time: '11:32:04 AM', completed: true },
      { title: 'UPI Payment Confirmed (₹110.00)', time: '11:32:18 AM', completed: true },
      { title: 'Locker L-07 Locked & Ready', time: '11:32:20 AM', completed: true },
    ],
  },
  {
    id: 'ord_1233',
    orderNumber: 'ORD1233',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 }, // KitKat ₹50
      { product: INITIAL_PRODUCTS[0], quantity: 1 }, // Lay's ₹30
    ],
    totalPaise: 7000,
    status: 'unpaid',
    lockerNumber: 'L-02',
    createdAt: 'Today, 11:30 AM',
    expiresInSeconds: 120,
    expiresAt: Date.now() + 40000,
    timeline: [
      { title: 'Order Placed', time: '11:30:12 AM', completed: true },
      { title: 'Stock Held (120s countdown)', time: '11:30:12 AM', completed: true },
      { title: 'Awaiting UPI QR scan', time: '11:30:15 AM', completed: false },
    ],
  },
  {
    id: 'ord_1232',
    orderNumber: 'ORD1232',
    items: [
      { product: INITIAL_PRODUCTS[3], quantity: 2 }, // Oreo ₹35 x 2 = ₹70
      { product: INITIAL_PRODUCTS[2], quantity: 1 }, // KitKat ₹50
    ],
    totalPaise: 12000,
    status: 'expired',
    lockerNumber: undefined,
    createdAt: 'Today, 11:28 AM',
    expiresInSeconds: 0,
    expiresAt: Date.now() - 300000,
    timeline: [
      { title: 'Order Placed', time: '11:26:10 AM', completed: true },
      { title: 'Hold Expired (Payment not received)', time: '11:28:10 AM', completed: true },
      { title: 'Stock Released Back to Inventory', time: '11:28:11 AM', completed: true },
    ],
  },
  {
    id: 'ord_1231',
    orderNumber: 'ORD1231',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 }, // KitKat ₹50
    ],
    totalPaise: 5000,
    status: 'needs_review',
    lockerNumber: undefined,
    createdAt: 'Today, 11:25 AM',
    expiresInSeconds: 0,
    expiresAt: Date.now() - 600000,
    timeline: [
      { title: 'Order Placed', time: '11:23:00 AM', completed: true },
      { title: 'Partial Webhook Captured (Amount mismatch ₹40 vs ₹50)', time: '11:25:00 AM', completed: true },
      { title: 'Marked For Staff / Manager Review', time: '11:25:02 AM', completed: true },
    ],
  },
  {
    id: 'ord_1230',
    orderNumber: 'ORD1230',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1 }, // Coke ₹40
      { product: INITIAL_PRODUCTS[3], quantity: 1 }, // Oreo ₹35
    ],
    totalPaise: 7500,
    status: 'claimed',
    lockerNumber: 'L-08',
    createdAt: 'Today, 11:15 AM',
    expiresInSeconds: 0,
    expiresAt: Date.now() - 900000,
    timeline: [
      { title: 'Order Placed', time: '11:13:00 AM', completed: true },
      { title: 'Payment Confirmed', time: '11:13:25 AM', completed: true },
      { title: 'Locker L-08 Dispensed & Claimed', time: '11:15:40 AM', completed: true },
    ],
  },
  {
    id: 'ord_1229',
    orderNumber: 'ORD1229',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 3 }, // Lay's ₹90
    ],
    totalPaise: 9000,
    status: 'paid',
    lockerNumber: 'L-01',
    createdAt: 'Today, 11:02 AM',
    expiresInSeconds: 0,
    expiresAt: Date.now() - 1500000,
    timeline: [
      { title: 'Order Placed', time: '11:00:10 AM', completed: true },
      { title: 'UPI Paid', time: '11:00:35 AM', completed: true },
      { title: 'Ready for Pickup', time: '11:02:00 AM', completed: true },
    ],
  },
];
