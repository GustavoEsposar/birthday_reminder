import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { DashboardController } from '../controllers/dashboardController';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();
const authController = new AuthController();
const dashboardController = new DashboardController();
const settingsController = new SettingsController();

router.get('/dashboard', authController.isAuthenticated.bind(authController), dashboardController.getDashboard.bind(dashboardController));

router.post('/add-birthdate', authController.isAuthenticated.bind(authController), dashboardController.addBirthdate.bind(dashboardController));

router.post('/delete-birthdate', authController.isAuthenticated.bind(authController), dashboardController.deleteBirthdate.bind(dashboardController));

router.post('/generate-telegram-token', authController.isAuthenticated.bind(authController), dashboardController.generateTelegramToken.bind(dashboardController));

router.get('/dashboard/settings', authController.isAuthenticated.bind(authController), settingsController.getSettings.bind(settingsController));

export default router;