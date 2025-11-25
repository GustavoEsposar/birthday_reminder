import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.render('index', {
        title: 'Birthday Reminder - Home'
    });
});

export default router;