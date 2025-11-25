const Pessoa = require('../models/Pessoa');

exports.getDashboard = async (req, res) => {
    try {
        const user = await Pessoa.findById(req.session.userId);
        res.render('dashboard', {
            title: 'Birthday Reminder - Dashboard',
            user: user
        });
    } catch (error) {
        res.status(500).send('Erro ao carregar o dashboard');
    }
};

exports.addBirthdate = async (req, res) => {
    try {
        const { name, birthdate } = req.body;
        await Pessoa.updateOne(
            { _id: req.session.userId },
            { $push: { birthdates: { name, date: birthdate } } }
        );
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao adicionar aniversário');
    }
};

exports.deleteBirthdate = async (req, res) => {
    try {
        const { birthdateId } = req.body;
        await Pessoa.updateOne(
            { _id: req.session.userId },
            { $pull: { birthdates: { _id: birthdateId } } }
        );
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao deletar aniversário');
    }
};
