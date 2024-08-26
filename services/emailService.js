const nodemailer = require('nodemailer');
const Pessoa = require('../models/Pessoa');

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
    console.log('Mês:', month, 'Dia:', day);
    console.log(day + intervalo);
    


    // Busca aniversariantes do dia de hoje
    const aniversarios = await Pessoa.find({
        $expr: {
            $and: [
                { $eq: [{ $month: "$date" }, month] },
                { $eq: [{ $dayOfMonth: "$date" }, day + intervalo] }
            ]
        }
    }).sort({ date: 1 }); // Ordena por data

    aniversarios.forEach((aniversario) => {
        
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.RECIPIENT,
            subject: 'Birthday Reminder 📅🎊' + mensagem,
            text: `Aniversário de ${aniversario.name}!`
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
