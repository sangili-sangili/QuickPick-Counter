import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
} from '../controllers/customerController.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);

export default router;
