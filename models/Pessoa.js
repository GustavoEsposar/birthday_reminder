const mongoose = require('mongoose');

const pessoaSchema = new mongoose.Schema({
    name: String,
    date: Date
});

module.exports = mongoose.model('Pessoa', pessoaSchema);