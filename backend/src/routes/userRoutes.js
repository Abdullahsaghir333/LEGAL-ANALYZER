import express from 'express';
import { authUser, registerUser, getUserProfile, googleLogin, getLawyers, logoutUser } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);
router.get('/lawyers', protect, getLawyers);

export default router;
