import express from 'express';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addCaseUpdate,
  addCaseMessage,
  uploadCaseDocument,
  getCaseDocumentText,
  closeCase,
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

router.route('/:id/updates')
  .post(protect, addCaseUpdate);

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.route('/:id/messages')
  .post(protect, addCaseMessage);

router.route('/:id/documents')
  .post(protect, upload.single('file'), uploadCaseDocument);

router.route('/:id/documents/:docId')
  .get(protect, getCaseDocumentText);

router.route('/:id/close')
  .patch(protect, closeCase);

export default router;
