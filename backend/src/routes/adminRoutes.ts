import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

// Controllers
import { adminLogin, getAdminProfile } from '../controllers/adminAuthController.js';
import { getDashboardStats } from '../controllers/adminDashboardController.js';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../controllers/adminCategoryController.js';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductStock,
  deleteAdminProduct,
} from '../controllers/adminProductController.js';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  simulateAdminOrder,
  deleteAdminOrder,
} from '../controllers/adminOrderController.js';
import {
  getAdminLockers,
  toggleUnlockLocker,
  setLockerMaintenance,
  resetLocker,
  emergencyUnlockAll,
} from '../controllers/adminLockerController.js';
import {
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/adminNotificationController.js';
import {
  getAdminCustomers,
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
} from '../controllers/adminCustomerController.js';

const router = Router();

// ==========================================
// 1. Admin Authentication (Public Route)
// ==========================================
router.post('/auth/login', adminLogin);

// ==========================================
// Protected Routes: Require JWT & Admin Role
// ==========================================
router.use(authenticate as any);
router.use(requireAdmin as any);

// 2. Admin Profile
router.get('/auth/me', getAdminProfile);

// 3. Dashboard Telemetry & Stats
router.get('/dashboard', getDashboardStats);

// 4. Categories Management
router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

// 5. Products Catalog Management
router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.patch('/products/:id/stock', updateAdminProductStock);
router.delete('/products/:id', deleteAdminProduct);

// 6. Orders & Kiosk Transactions
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateAdminOrderStatus);
router.post('/orders/simulate', simulateAdminOrder);
router.delete('/orders/:id', deleteAdminOrder);

// 7. Lockers & Solenoid Control
router.get('/lockers', getAdminLockers);
router.patch('/lockers/:id/unlock', toggleUnlockLocker);
router.patch('/lockers/:id/maintenance', setLockerMaintenance);
router.post('/lockers/:id/reset', resetLocker);
router.post('/lockers/emergency-unlock-all', emergencyUnlockAll);

// 8. Notifications Feed
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/mark-all-read', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// 9. Customer Directory
router.get('/customers', getAdminCustomers);
router.post('/customers', createAdminCustomer);
router.put('/customers/:id', updateAdminCustomer);
router.delete('/customers/:id', deleteAdminCustomer);

export default router;
