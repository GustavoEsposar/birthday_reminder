const { authenticateToken } = require('../controllers/authController');
const { getBirthdates, loginMobile, addBirthdateMobile, deleteBirthdateMobile, addByQRCode } = require('../controllers/mobileController');
const express = require('express');
const router = express.Router();

router.get('/getBirthdates', authenticateToken, getBirthdates);

router.post('/loginMobile', loginMobile);

router.post('/addBirthdateMobile', authenticateToken, addBirthdateMobile);

router.post('/deleteBirthdateMobile', authenticateToken, deleteBirthdateMobile);

router.post('/addByQRCode', authenticateToken, addByQRCode);

module.exports = router;