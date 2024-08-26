const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const { enviarLembretePorEmail } = require('./services/emailService');
const Pessoa = require('./models/Pessoa');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGOOSE_OPTIONS = { };
mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso');
        enviarLembretePorEmail(0, " - HOJE");
        enviarLembretePorEmail(2, " - Em 2 dias");
        enviarLembretePorEmail(7, " - Em 7 dias");
    })
    .catch((error) => {
        console.log('Erro ao conectar ao MongoDB:', error);
    });

app.get('/', async (req, res) => {
    //enviarLembretePorEmail(0, " - HOJE");
    //enviarLembretePorEmail(2, " - Em 2 dias");
    //enviarLembretePorEmail(7, " - Em 7 dias");
});

cron.schedule('11 15 * * *', async () => {
    await enviarLembretePorEmail(0, " - HOJE");
    await enviarLembretePorEmail(2, " - Em 2 dias");
    await enviarLembretePorEmail(7, " - Em 7 dias");
});

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});
