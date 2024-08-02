const nodemailer = require('nodemailer');
const Pessoa = require('../models/Pessoa');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const enviarLembretePorEmail = async () => {
    const today = new Date();
    const aniversarios = await Pessoa.find({
        date: {
            $dayOfYear: today.getUTCDate()
        }
    });

    aniversarios.forEach((aniversario) => {
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.RECIPIENT,
            subject: 'Birthday Reminder 📅🎊',
            text: `Hoje é aniversário de ${aniversario.name}!`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(`Error: ${error}`);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });
    });
}

module.exports = { enviarLembretePorEmail };