const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const { enviarLembretePorEmail } = require('./services/emailService');
const Aniversariante = require('./models/Pessoa');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGOOSE_OPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS);

app.get('/', (req, res) => {
    res.send('Serviço em funcionamento.');
})

cron.schedule('0 5 * * *', async () => {
    await enviarLembretePorEmail();
});

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});