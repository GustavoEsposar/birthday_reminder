import { Router} from 'express';
import type { Request, Response } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

const authController = new AuthController();

router.get('/login', (req: Request, res: Response) => {
    res.render('login', { title: 'Login' });
});
router.post('/login', authController.login.bind(authController));

router.get('/register', (req: Request, res: Response) => {
    res.render('register', { title: 'Register' });
});
router.post('/register', authController.register.bind(authController));

export default router;
