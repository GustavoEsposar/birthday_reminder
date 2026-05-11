import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { InviteController } from '../controllers/InviteController';

const router = Router();
const authController = new AuthController();
const inviteController = new InviteController();

router.post(
    '/app/invite/generate',
    authController.isAuthenticated.bind(authController),
    inviteController.generateLink.bind(inviteController)
);

router.delete(
    '/app/invite',
    authController.isAuthenticated.bind(authController),
    inviteController.cancelLink.bind(inviteController)
);

router.post(
    '/app/invite/approve/:pendingId',
    authController.isAuthenticated.bind(authController),
    inviteController.approvePending.bind(inviteController)
);

router.post(
    '/app/invite/reject/:pendingId',
    authController.isAuthenticated.bind(authController),
    inviteController.rejectPending.bind(inviteController)
);

export default router;
