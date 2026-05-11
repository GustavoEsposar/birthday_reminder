import { Router } from 'express';
import { PublicInviteController } from '../controllers/PublicInviteController';

const router = Router();
const publicInviteController = new PublicInviteController();

router.get('/invite/:token', publicInviteController.showForm.bind(publicInviteController));
router.get('/invite/:token/success', publicInviteController.showSuccess.bind(publicInviteController));
router.post('/invite/:token/submit', publicInviteController.submitForm.bind(publicInviteController));

export default router;
