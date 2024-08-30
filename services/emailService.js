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
            user.birthdates.forEach(() => {

            });
            //const aniversariantes = buscarAniversariantes(intervalo);
            
            enviarEmail(aniversario, mensagem, substituirVariaveisDoTemplate(prepararTemplate(), aniversario, intervalo));
        });
    } else {
        console.log(`Nenhuma conta registrada no sistema`);
    }
}

const buscarUsuarios = async () => {
    return await Pessoa.find();
}

const buscarAniversariantes = async (intervalo) => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + intervalo)

    const month = hoje.getUTCMonth() + 1; // Mês é zero-based
    const day = hoje.getUTCDate();    

    // Busca aniversariantes do dia de hoje
    const aniversarios = await Pessoa.find({
        $expr: {
            $and: [
                { $eq: [{ $month: "$date" }, month] },
                { $eq: [{ $dayOfMonth: "$date" }, day] }
            ]
        }
    }).sort({ date: 1 }); // Ordena por data

    return aniversarios;
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

const enviarEmail = (aniversario, mensagem, htmlContent) => {
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
}

module.exports = { enviarLembretePorEmail };