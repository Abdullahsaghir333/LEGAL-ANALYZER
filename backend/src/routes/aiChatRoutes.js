import express from 'express';
import multer from 'multer';
import { getChats, getChatById, deleteChat, sendMessage, extractDocument, uploadLawyerDocument } from '../controllers/aiChatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(protect, getChats);

router.route('/:id')
  .get(protect, getChatById)
  .delete(protect, deleteChat);

router.route('/:id?/message')
  .post(protect, sendMessage);

router.route('/upload')
  .post(protect, upload.single('file'), extractDocument);

router.route('/lawyer-docs/upload')
  .post(protect, upload.single('file'), uploadLawyerDocument);

export default router;
