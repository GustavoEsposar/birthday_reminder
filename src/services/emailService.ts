import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

import Pessoa from "../models/Pessoa.js";
import type { IPessoa } from "../models/Pessoa.js";

const BATCH_SIZE = 100;

interface AniversarioFiltrado {
    name: string;
    date: Date;
}

interface UsuarioComAniversarios {
    user: IPessoa;
    aniversarios: AniversarioFiltrado[];
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL!,
        pass: process.env.PASSWORD!
    },
    attachments: [
        {
            filename: "logo.png",
            path: path.join(__dirname, "../public/img/logo.png"),
            cid: "logoBirthdayReminder" // mesmo nome do cid usado no HTML
        }
    ]
});

//=============================================== lógica core de envio de lembrete por email
export const enviarLembretePorEmail = async (
    intervalo: number,
    mensagem: string
): Promise<void> => {
    const usuarios = await buscarUsuarios(intervalo);

    if (usuarios.length === 0) {
        console.log("Nenhuma conta com aniversários no dia.");
        return;
    }

    const template = selecionarTemplate(intervalo);

    for (const { user, aniversarios } of usuarios) {

        const aniversariosUl = aniversarios
            .map(a => `<li>${a.name} — ${a.date}</li>`)
            .join("");

        const html = substituirVariaveisDoTemplate(
            template,
            intervalo,
            aniversariosUl
        );

        await enviarEmail(user, mensagem, html);
    }
};

const buscarUsuarios = async (
    intervalo: number
): Promise<UsuarioComAniversarios[]> => {
    const hoje = new Date();
    const alvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    alvo.setDate(alvo.getDate() + intervalo);

    const targetMonth = alvo.getUTCMonth() + 1;
    const targetDay = alvo.getUTCDate();

    const resultados: UsuarioComAniversarios[] = [];

    // Stream do Mongo — NÃO carrega tudo em RAM
    const cursor = Pessoa.find({})
        .lean()
        .batchSize(BATCH_SIZE)
        .cursor();

    for (
        let user = (await cursor.next()) as IPessoa | null;
        user !== null;
        user = (await cursor.next()) as IPessoa | null
    ) {
        if (!user.birthdates || user.birthdates.length === 0) continue;

        // Filtra apenas os aniversários do intervalo desejado
        const aniversariosFiltrados = user.birthdates.filter((b) => {
            const data = new Date(b.date);
            return (
                data.getUTCMonth() + 1 === targetMonth &&
                data.getUTCDate() === targetDay
            );
        });

        if (aniversariosFiltrados.length > 0) {
            resultados.push({
                user,
                aniversarios: aniversariosFiltrados.map((a) => ({
                    name: a.name,
                    date: a.date,
                })),
            });
        }
    }

    return resultados;
};
//===============================================

const selecionarTemplate = (intervalo: number): string => {
    const templatePath =
        intervalo === 0
            ? path.join(__dirname, "../templates/todayTemplate.html")
            : path.join(__dirname, "../templates/fewDaysTemplate.html");

    return fs.readFileSync(templatePath, "utf-8");
};

const substituirVariaveisDoTemplate = (
    template: string,
    intervalo: number,
    aniversariosUl: string
): string => {
    return template
        .replace("{{birthdayList}}", aniversariosUl)
        .replace("{{qtde}}", (aniversariosUl.match(/<li>/g)?.length || 0).toString())
        .replace("{{days}}", intervalo.toString());
};

const enviarEmail = async (user: IPessoa, mensagem: string, htmlContent: string): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: `Birthday Reminder 📅🎊 ${mensagem}`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email enviado para ${user.email}: ${info.response}`);
    } catch (err) {
        console.error(`Erro ao enviar email para ${user.email}:`, err);
    }
};