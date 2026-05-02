import { Router} from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

const authController = new AuthController();

router.get('/login', authController.getLogin.bind(authController));

router.post('/login', authController.login.bind(authController));

router.get('/login/recovery', authController.getForgotPasswordView.bind(authController));

router.post('/login/generate-recovery-token', authController.forgotPassword.bind(authController));

router.post('/login/recovery', authController.resetPassword.bind(authController));

router.get('/register', authController.getRegister.bind(authController));

router.post('/register', authController.register.bind(authController));

// Endpoint unificado de verificação de email (pendencia de cadastro) — usado pelo /register e pelo /login
router.post('/register/verify-email', authController.verifyEmail.bind(authController));

export default router;
