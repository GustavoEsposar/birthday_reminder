const { authenticateToken } = require('../controllers/authController');
const { getBirthdates, loginMobile } = require('../controllers/mobileController');
const express = require('express');
const router = express.Router();

router.post('/loginMobile', loginMobile);

router.get('/getBirthdates', authenticateToken, getBirthdates);

module.exports = router;

