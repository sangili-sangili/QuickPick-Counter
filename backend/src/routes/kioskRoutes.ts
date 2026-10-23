import { Router } from 'express';
import {
  getKioskProducts,
  searchProducts,
  getProductById,
  createKioskOrder,
  claimKioskPickup,
  confirmOrderPayment,
} from '../controllers/kioskController.js';
import { getActiveCategories } from '../controllers/categoryController.js';
import { submitFeedback, getFeedbacks } from '../controllers/feedbackController.js';

const router = Router();

// Public Categories (Active only)
router.get('/categories', getActiveCategories);

// Public Product Catalog (Active only)
router.get('/products', getKioskProducts);
router.get('/products/search', searchProducts);
router.get('/products/:id', getProductById);

// Public Orders & Pickup
router.post('/orders', createKioskOrder);
router.post('/orders/:orderId/pay', confirmOrderPayment);
router.post('/orders/:orderId/pickup-claim', claimKioskPickup);

// Feedback & Rating API
router.post('/feedback', submitFeedback);
router.get('/feedback', getFeedbacks);

export default router;
