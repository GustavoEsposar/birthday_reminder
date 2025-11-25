import { Router } from 'express';

import { authenticateToken } from '../controllers/authController.js';
import {
    getBirthdates, loginMobile, addBirthdateMobile, deleteBirthdateMobile, registerMobile, validateToken
} from '../controllers/mobileController.js';

const router = Router();

router.get('/getBirthdates', authenticateToken, getBirthdates);

router.post('/loginMobile', loginMobile);

router.post('/registerMobile', registerMobile);

router.post('/addBirthdateMobile', authenticateToken, addBirthdateMobile);

router.post('/deleteBirthdateMobile', authenticateToken, deleteBirthdateMobile);

router.post('/validateToken', validateToken);

export default router;