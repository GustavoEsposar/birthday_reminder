const nodemailer = require('nodemailer');
const Pessoa = require('../models/Pessoa');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const enviarLembretePorEmail = async (intervalo, mensagem) => {
    const hoje = new Date();

    const month = hoje.getUTCMonth() + 1; // Mês é zero-based
    const day = hoje.getUTCDate();

    // Busca aniversariantes do dia de hoje
    const aniversarios = await Pessoa.find({
        $expr: {
            $and: [
                { $eq: [{ $month: "$date" }, month] },
                { $eq: [{ $dayOfMonth: "$date" }, day + intervalo] }
            ]
        }
    }).sort({ date: 1 }); // Ordena por data

    // Carregar o conteúdo HTML
    const templatePath = path.join(__dirname, '../templates/todayTemplate.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    aniversarios.forEach((aniversario) => {
        // Substituir as variáveis do template
        const htmlContent = template
            .replace('{{name}}', aniversario.name);

        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.RECIPIENT,
            subject: 'Birthday Reminder 📅🎊' + mensagem,
            html: htmlContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(`Error: ${error}`);
            } else {
                console.log(`Email enviado para ${aniversario.name}: ${info.response}`);
            }
        });
    });
};

module.exports = { enviarLembretePorEmail };
