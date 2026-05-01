import express from 'express';
import {
  getContracts,
  uploadContract,
  getContractById,
} from '../controllers/contractController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getContracts)
  .post(protect, uploadContract);

router.route('/:id')
  .get(protect, getContractById);

export default router;
