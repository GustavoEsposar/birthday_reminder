const mongoose = require('mongoose');

const pessoaSchema = new mongoose.Schema({
    email: String,
    birthdates: [{
        name: String,
        date: Date
    }]
}, { collection: 'contas' });

module.exports = mongoose.model('Pessoa', pessoaSchema);
