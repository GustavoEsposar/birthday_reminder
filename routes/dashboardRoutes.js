const express = require('express');
const { isAuthenticated } = require('../controllers/authController');
const { getDashboard, addBirthdate, deleteBirthdate } = require('../controllers/dashboardController');
const router = express.Router();

router.get('/dashboard', isAuthenticated, getDashboard);

router.post('/add-birthdate', isAuthenticated, addBirthdate);

router.post('/delete-birthdate', isAuthenticated, deleteBirthdate);

module.exports = router;