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
    })
    .catch((error) => {
        console.log('Erro ao conectar ao MongoDB:', error);
    });

app.get('/', async (req, res) => {
    // Carregar lista de aniversários, verificar quem faz aniversário hoje
    const today = new Date();
    const month = today.getUTCMonth() + 1;
    const day = today.getUTCDate();

    const aniversarios = await Pessoa.find({
        $expr: {
            $and: [
                { $eq: [{ $month: "$date" }, month] },
                { $eq: [{ $dayOfMonth: "$date" }, day] }
            ]
        }
    }).sort({ date: 1 });

    if (aniversarios.length > 0) {        
        await enviarLembretePorEmail(0, " - HOJE");
        res.send(`Emails enviados para os aniversariantes de hoje.`);
    } else {
        res.send('Nenhum aniversário encontrado para hoje.');
    }
});

cron.schedule('0 5 * * *', async () => {
    await enviarLembretePorEmail(0, " - HOJE");
    await enviarLembretePorEmail(2, " - Em 2 dias");
});

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});
