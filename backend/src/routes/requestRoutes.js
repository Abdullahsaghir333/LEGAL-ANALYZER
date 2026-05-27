import express from 'express';
import { createRequest, getLawyerRequests, updateRequestStatus } from '../controllers/requestController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createRequest).get(protect, getLawyerRequests);
router.route('/:id').put(protect, updateRequestStatus);

export default router;
