import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getDashboard, getRevenueAnalytics } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', protect, getDashboard);
router.get('/revenue', protect, getRevenueAnalytics);

export default router;
