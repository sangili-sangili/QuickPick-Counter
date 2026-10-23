import { Router } from 'express';
import { getKioskProducts, createKioskOrder, claimKioskPickup } from '../controllers/kioskController.js';

const router = Router();

// Kiosk Product Catalog
router.get('/products', getKioskProducts);

// Kiosk Orders
router.post('/orders', createKioskOrder);
router.post('/orders/:orderId/pickup-claim', claimKioskPickup);

export default router;
