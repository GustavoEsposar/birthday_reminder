import { Router} from 'express';
import type { Request, Response } from 'express';
import { login, register } from '../controllers/authController.js';

const router = Router();

router.get('/login', (req: Request, res: Response) => {
    res.render('login', { title: 'Login' });
});
router.post('/login', login);

router.get('/register', (req: Request, res: Response) => {
    res.render('register', { title: 'Register' });
});
router.post('/register', register);

export default router;
