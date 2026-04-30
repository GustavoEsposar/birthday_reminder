import { Router } from 'express';

import { AuthController } from '../controllers/authController';
import { MobileController } from '../controllers/mobileController';

const router = Router();

const authController = new AuthController();
const mobileController = new MobileController();

router.get('/getBirthdates', authController.authenticateToken.bind(authController), mobileController.getBirthdates.bind(mobileController));
router.post('/loginMobile', mobileController.loginMobile.bind(mobileController));

router.post('/registerMobile', mobileController.registerMobile.bind(mobileController));

router.post('/addBirthdateMobile', authController.authenticateToken.bind(authController), mobileController.addBirthdateMobile.bind(mobileController));

router.post('/deleteBirthdateMobile', authController.authenticateToken.bind(authController), mobileController.deleteBirthdateMobile.bind(mobileController));
router.post('/validateToken', mobileController.validateToken.bind(mobileController));

export default router;