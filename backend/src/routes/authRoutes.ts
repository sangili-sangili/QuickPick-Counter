import { Router } from 'express';
import {
  adminLogin,
  customerLogin,
  customerRegister,
  getMe,
} from '../controllers/authController.js';

const router = Router();

// Admin Authentication API
router.post('/admin/login', adminLogin);

// Customer Authentication APIs
router.post('/customer/login', customerLogin);
router.post('/customer/register', customerRegister);

// Session check
router.get('/me', getMe);

export default router;
