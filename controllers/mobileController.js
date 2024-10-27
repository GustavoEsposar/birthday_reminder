const Pessoa = require('../models/Pessoa');
const jwt = require('jsonwebtoken');

exports.getBirthdates = async (req, res) => {
    try {
        const userId = req.user.userId; 
        
        const user = await Pessoa.findById(userId);
        if (!user) {
            return res.status(404).send('Usuário não encontrado');
        }
        return res.json(user.birthdates);
    } catch (error) {
        res.status(500).send('Erro ao carregar a lista de aniversariantes');
    }
};


exports.loginMobile = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await Pessoa.findOne({ email });   
        
        if (user && await user.matchPassword(password)) {
            // Gerar token JWT
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET /*, { expiresIn: '1h' }*/);
            
            res.json({ token });
        } else {
            res.status(400).json({ message: 'Credenciais inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
}