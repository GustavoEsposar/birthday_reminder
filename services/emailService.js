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
    const usuarios = await buscarUsuarios();
    
    if(usuarios.length > 0) {
            usuarios.forEach((user) => {
                filtrarAniversariantes(user, intervalo).forEach((aniversario) => {
                    enviarEmail(user, mensagem, substituirVariaveisDoTemplate(prepararTemplate(intervalo), aniversario, intervalo));
                });
            });
    } else {
        console.log(`Nenhuma conta registrada no sistema`);
    }
}

const buscarUsuarios = async () => {
    return await Pessoa.find();
}

const filtrarAniversariantes = (user, intervalo) => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + intervalo)

    const month = hoje.getUTCMonth() + 1; // Mês é zero-based
    const day = hoje.getUTCDate();    

    const aniversariantes = user.birthdates.filter((birthdate) => {
        const data = new Date(birthdate.date);

        return (data.getUTCMonth() + 1 === month) && (data.getUTCDate() === day);
    });

    return aniversariantes;
}

const prepararTemplate = (intervalo) => {
    // Carregar o conteúdo HTML
    let templatePath;
    if (intervalo == 0) {
        templatePath = path.join(__dirname, '../templates/todayTemplate.html');
    } else {
        templatePath = path.join(__dirname, '../templates/fewDaysTemplate.html');
    }
    const template = fs.readFileSync(templatePath, 'utf-8');
    return template;
}

const substituirVariaveisDoTemplate = (template, aniversariante, intervalo) => {
    const htmlContent = template
                .replace('{{name}}', aniversariante.name)
                .replace('{{days}}', intervalo);
    return htmlContent;
}

const enviarEmail = (user, mensagem, htmlContent) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Birthday Reminder 📅🎊' + mensagem,
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error: ${error}`);
        } else {
            console.log(`Email enviado para ${user.birthdates.name}: ${info.response}`);
        }
    });
}

module.exports = { enviarLembretePorEmail };