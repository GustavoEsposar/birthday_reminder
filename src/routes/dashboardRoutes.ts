import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { DashboardController } from '../controllers/dashboardController';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();
const authController = new AuthController();
const dashboardController = new DashboardController();
const settingsController = new SettingsController();

router.get('/app', authController.isAuthenticated.bind(authController), dashboardController.getDashboard.bind(dashboardController));

router.post('/app/add-birthdate', authController.isAuthenticated.bind(authController), dashboardController.addBirthdate.bind(dashboardController));

router.post('/app/delete-birthdate', authController.isAuthenticated.bind(authController), dashboardController.deleteBirthdate.bind(dashboardController));

router.get('/app/settings', authController.isAuthenticated.bind(authController), settingsController.getSettings.bind(settingsController));

router.post('/app/settings/generate-telegram-token', authController.isAuthenticated.bind(authController), dashboardController.generateTelegramToken.bind(dashboardController));

router.post('/app/settings/revoke-telegram', authController.isAuthenticated.bind(authController), dashboardController.revokeTelegram.bind(dashboardController));

export default router;