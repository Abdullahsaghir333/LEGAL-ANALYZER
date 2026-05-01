import express from 'express';
import { authUser, registerUser, getUserProfile, googleLogin } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);

export default router;
