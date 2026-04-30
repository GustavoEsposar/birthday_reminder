import { Router} from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

const authController = new AuthController();

router.get('/login', authController.getLogin.bind(authController));

router.post('/login', authController.login.bind(authController));

router.get('/register', authController.getRegister.bind(authController));

router.post('/register', authController.register.bind(authController));

export default router;
