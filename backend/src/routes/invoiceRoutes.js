import express from 'express';
import {
  getInvoices,
  createInvoice,
  getInvoiceById,
} from '../controllers/invoiceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoiceById);

export default router;
