const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const timezone = 'America/Sao_Paulo'; 
require('dotenv').config();

const { enviarLembretePorEmail } = require('./services/emailService');
const Pessoa = require('./models/Pessoa');

const app = express();
const PORT = process.env.PORT || 3000;

const rotinaDeNotificacao = async () => {
    enviarLembretePorEmail(0, " - HOJE");
    enviarLembretePorEmail(2, " - Em 2 dias");
    enviarLembretePorEmail(7, " - Em 7 dias");
}

const MONGOOSE_OPTIONS = { };
mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso');
        //rotinaDeNotificacao();  //apenas para verificar o deploy da aplicação
    })
    .catch((error) => {
        console.log('Erro ao conectar ao MongoDB:', error);
    });

app.get('/', (req, res) => {
    res.send('Aplicação está ativa!' + new Date().toISOString());
});

cron.schedule('0 5 * * *', async () => {
    await rotinaDeNotificacao();
}, {
    timezone: timezone
});

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});
