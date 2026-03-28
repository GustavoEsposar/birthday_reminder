import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import type { IPessoa } from "../models/Pessoa";
import type { UsuarioComAniversarios, INotificationProvider } from "../types/NotificationTypes";

export class EmailService implements INotificationProvider {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Inicializa o transporter assim que a classe for instanciada
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
        });
    }

    // Implementação obrigatória da interface
    public async send(usuarios: UsuarioComAniversarios[]): Promise<void> {
        if (usuarios.length === 0) {
            console.log("[EmailService] Nenhuma conta para notificar hoje.");
            return;
        }

        const template = this.selecionarTemplate();

        for (const { user, aniversarios } of usuarios) {
            // Se o usuário por algum motivo não tiver email, pula a iteração
            if (!user.email) continue;

            let corpoHtml = "";

            for (const { intervalo, aniversarios: aniversariosDoDia } of aniversarios) {
                corpoHtml += `
                ${intervalo === 0 ? "<div class=\"email__div--today\">" : ""}
                    <p class="email__text">
                        ${intervalo === 0
                        ? "<strong>Hoje</strong>"
                        : `Em <strong>${intervalo}</strong> dia(s)`
                    }, <strong>${aniversariosDoDia.length}</strong> aniversariante(s):
                    </p>

                    <ul class="email__birthday-list">
                        ${aniversariosDoDia
                        .map(a => {
                            const d = new Date(a.date);
                            const dia = String(d.getUTCDate()).padStart(2, "0");
                            const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
                            const ano = d.getUTCFullYear();
                            return `<li>${a.name} — ${dia}/${mes}/${ano}</li>`;
                        })
                        .join("")
                    }
                    </ul>
                    ${intervalo === 0 ? "</div>" : ""}
                `;
            }

            const html = this.substituirVariaveisDoTemplate(template, corpoHtml);

            // Chama o método privado para realizar o envio
            await this.enviarEmail(user, html);
        }
    }

    // --- Métodos Privados da Classe ---

    private selecionarTemplate(): string {
        const templatePath = path.join(__dirname, "../../templates/todayTemplate.html");
        return fs.readFileSync(templatePath, "utf-8");
    }

    private substituirVariaveisDoTemplate(template: string, aniversariosUl: string): string {
        return template.replace("{{Beggining}}", aniversariosUl);
    }

    private async enviarEmail(user: IPessoa, htmlContent: string): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: `Seu lembrete de aniversários chegou!`,
            html: htmlContent
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email enviado para ${user.email}: ${info.response}`);
        } catch (err) {
            console.error(`Erro ao enviar email para ${user.email}:`, err);
        }
    }
}

// Exportamos uma instância única (Singleton) para ser usada pelo Orquestrador
export const emailService = new EmailService();