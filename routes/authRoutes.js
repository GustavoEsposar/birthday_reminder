const express = require('express');
const { login, register } = require('../controllers/authController');
const router = express.Router();

router.get('/login', (req, res) => res.render('login', { title: 'Login' }));
router.post('/login', login);

router.get('/register', (req, res) => res.render('register', { title: 'Register' }));
router.post('/register', register);

module.exports = router;