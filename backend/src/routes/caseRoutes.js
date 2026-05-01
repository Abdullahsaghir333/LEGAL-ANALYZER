import express from 'express';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
} from '../controllers/caseController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCases)
  .post(protect, createCase);

router.route('/:id')
  .get(protect, getCaseById)
  .put(protect, updateCase)
  .delete(protect, deleteCase);

export default router;
