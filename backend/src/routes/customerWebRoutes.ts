import { Router } from 'express';
import { authenticate, requireCustomer } from '../middlewares/authMiddleware.js';
import {
  getCustomerProfile,
  updateCustomerProfile,
} from '../controllers/customerProfileController.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';

const router = Router();

// Protect all customer routes with JWT authentication
router.use(authenticate, requireCustomer);

// Customer Profile
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Cart
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:productId', updateCartItem);
router.delete('/cart/:productId', removeFromCart);
router.delete('/cart', clearCart);

export default router;
