import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { DashboardController } from '../controllers/dashboardController.js';

const router = Router();
const authController = new AuthController();
const dashboardController = new DashboardController();

router.get('/dashboard', authController.isAuthenticated.bind(authController), dashboardController.getDashboard.bind(dashboardController));

router.post('/add-birthdate', authController.isAuthenticated.bind(authController), dashboardController.addBirthdate.bind(dashboardController));

router.post('/delete-birthdate', authController.isAuthenticated.bind(authController), dashboardController.deleteBirthdate.bind(dashboardController));

export default router;