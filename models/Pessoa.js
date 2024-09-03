const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pessoaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        requiered: true
    },
    birthdates: [{
        name: String,
        date: Date,
        required: true
    }]
}, { collection: 'contas' });

// Middleware para criptografar a senha antes de salvar
pessoaSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar a senha fornecida com a senha armazenada
pessoaSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Pessoa', pessoaSchema);
