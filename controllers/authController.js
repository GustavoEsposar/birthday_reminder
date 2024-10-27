const jwt = require('jsonwebtoken');
const Pessoa = require('../models/Pessoa');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Pessoa.findOne({ email });
        if (user && await user.matchPassword(password)) {
            req.session.userId = user._id;
            res.redirect('/dashboard');
        } else {
            res.status(400).send('Credenciais inválidas');
        }
    } catch (error) {
        res.status(500).send('Erro ao fazer login');
    }
};

exports.register = async (req, res) => {
    const { name, email, passwordOne, passwordTwo } = req.body;
    try {
        if (passwordOne != passwordTwo) throw new Error("As senhas não são iguais!");
        const user = new Pessoa({ name, email, password: passwordOne });
        await user.save();
        req.session.userId = user._id;
        res.redirect('/login');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
};

exports.authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acesso negado' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });
};