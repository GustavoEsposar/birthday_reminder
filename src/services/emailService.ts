import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";

const BATCH_SIZE = 100;

interface AniversarioFiltrado {
    name: string;
    date: Date;
}

interface AniversariosPorDiaList {
    intervalo: number,
    aniversarios: AniversarioFiltrado[];
}

interface UsuarioComAniversarios {
    user: IPessoa;
    aniversarios: AniversariosPorDiaList[];
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
});

//=============================================== lógica core de envio de lembrete por email
export const enviarLembretePorEmail = async (): Promise<void> => {
    const usuarios = await buscarUsuarios();

    if (usuarios.length === 0) {
        console.log("Nenhuma conta com aniversários no dia.");
        return;
    }

    const template = selecionarTemplate();

    for (const { user, aniversarios } of usuarios) {
        let corpoHtml = "";

        for (const { intervalo, aniversarios: aniversariosDoDia } of aniversarios) {
             corpoHtml += `<p class="email__text">Em <strong>${intervalo}</strong> dia(s), <strong>${aniversariosDoDia.length}</strong> aniversariante(s):</p>
                <ul class="email__birthday-list">
                ${ 
                    aniversariosDoDia
                    .map(a => `<li>${a.name} — ${new Date(a.date).toLocaleDateString("pt-BR")}</li>`)
                    .join("")
                }
                </ul>
             `;            
        }

        const html = substituirVariaveisDoTemplate(
            template,
            corpoHtml
        );

        await enviarEmail(user, html);
    }
};

const buscarUsuarios = async (): Promise<UsuarioComAniversarios[]> => {
    const hoje = new Date();
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
        
        const aniversariosPorDia : AniversariosPorDiaList[] = []

        for (let intervalo of user.cron.map(d => parseInt(d))) {
            const alvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            alvo.setDate(alvo.getDate() + intervalo);
    
            const targetMonth = alvo.getUTCMonth() + 1;
            const targetDay = alvo.getUTCDate();
        
            // Filtra apenas os aniversários do intervalo desejado
            const aniversariosFiltrados = user.birthdates.filter((b) => {
                const data = new Date(b.date);
                return (
                    data.getUTCMonth() + 1 === targetMonth &&
                    data.getUTCDate() === targetDay
                );
            });

            // se nao houver aniversarios nesse intervalo, pula pro próximo intervalo
            if (aniversariosFiltrados.length === 0) continue;

            aniversariosPorDia.push({
                intervalo: intervalo,
                aniversarios: aniversariosFiltrados.map(b => ({
                    name: b.name,
                    date: b.date
                }))
            });
        }

        if (aniversariosPorDia.length > 0) {
            resultados.push({
                user,
                aniversarios: aniversariosPorDia
            });
        }
    }

    return resultados;
};
//===============================================

const selecionarTemplate = (): string => {
    const templatePath = path.join(__dirname, "../../templates/todayTemplate.html");

    return fs.readFileSync(templatePath, "utf-8");
};

const substituirVariaveisDoTemplate = (
    template: string,
    aniversariosUl: string
): string => {
    return template
        .replace("{{Beggining}}", aniversariosUl);
};

const enviarEmail = async (user: IPessoa, htmlContent: string): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: `Seu lembrete de aniversários chegou!`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email enviado para ${user.email}: ${info.response}`);
    } catch (err) {
        console.error(`Erro ao enviar email para ${user.email}:`, err);
    }
};