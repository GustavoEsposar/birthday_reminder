import { Router } from 'express';

import { isAuthenticated } from '../controllers/authController.js';
import { 
    getDashboard, 
    addBirthdate, 
    deleteBirthdate 
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/dashboard', isAuthenticated, getDashboard);

router.post('/add-birthdate', isAuthenticated, addBirthdate);

router.post('/delete-birthdate', isAuthenticated, deleteBirthdate);

export default router;