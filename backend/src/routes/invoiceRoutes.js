import express from 'express';
import {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoiceById,
} from '../controllers/invoiceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoiceById)
  .patch(protect, updateInvoice)
  .delete(protect, deleteInvoiceById);

export default router;
