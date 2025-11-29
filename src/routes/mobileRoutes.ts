import { Router } from 'express';

import { AuthController } from '../controllers/authController';
import {
    getBirthdates, loginMobile, addBirthdateMobile, deleteBirthdateMobile, registerMobile, validateToken
} from '../controllers/mobileController';

const router = Router();

const authController = new AuthController();

router.get('/getBirthdates', authController.authenticateToken.bind(authController), getBirthdates);
router.post('/loginMobile', loginMobile);

router.post('/registerMobile', registerMobile);

router.post('/addBirthdateMobile', authController.authenticateToken.bind(authController), addBirthdateMobile);

router.post('/deleteBirthdateMobile', authController.authenticateToken.bind(authController), deleteBirthdateMobile);

router.post('/validateToken', validateToken);

export default router;