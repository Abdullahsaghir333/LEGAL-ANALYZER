import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { summarizeLegalText } from '../controllers/summarizeController.js';

const router = express.Router();

router.post('/summarize', protect, summarizeLegalText);

export default router;
