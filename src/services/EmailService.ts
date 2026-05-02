import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import type { IPessoa } from "../models/Pessoa";
import type { UsuarioComAniversarios, INotificationProvider } from "../types/NotificationTypes";
import { TokenType } from "../models/Token";

export class EmailService implements INotificationProvider {
    private transporter: nodemailer.Transporter;
    private subject: string = "Lembrete de Aniversário";

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

        const template = this.selecionarTemplate('LEMBRETE');

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

    public async enviarToken(usuario: IPessoa, token: string, tipo: TokenType): Promise<void> {
        if (!usuario.email) {
            console.log(`[EmailService] O usuário ${usuario.name} não possui email cadastrado. Não foi possível enviar o token.`);
            return;
        }

        const template = this.selecionarTemplate('OTP');
        
        let title = "";
        let subtitle = "";
        let instructions = "";

        switch (tipo) {
            case TokenType.TELEGRAM_BIND:
                this.subject = "Seu token do Telegram chegou!";
                title = "Vincular Telegram";
                subtitle = "Utilize o código de verificação abaixo para conectar o Birthday Reminder ao seu aplicativo do Telegram.";
                instructions = `Copie o código acima e envie <strong>/bind seu-email@dominio.com ${token}</strong><br>para o nosso bot no Telegram.`;
                break;
            case TokenType.PASSWORD_RECOVERY:
                this.subject = "Recuperação de Senha";
                title = "Recuperar Senha";
                subtitle = "Recebemos um pedido para redefinir a sua senha. Utilize o código de verificação abaixo.";
                instructions = "Insira este código na tela de recuperação de senha.";
                break;
            case TokenType.ACCOUNT_DELETION:
                this.subject = "Confirmação de Exclusão de Conta";
                title = "Excluir Conta";
                subtitle = "Você solicitou a exclusão permanente da sua conta. Para prosseguir, confirme utilizando o código abaixo.";
                instructions = "Se você não solicitou isso, ignore este email ou altere sua senha imediatamente.";
                break;
            case TokenType.EMAIL_VERIFICATION:
                this.subject = "Confirme seu cadastro no Birthday Reminder";
                title = "Confirmar Cadastro";
                subtitle = "Obrigado por se cadastrar! Use o código abaixo para ativar sua conta.";
                instructions = "Insira este código na tela de cadastro para ativar sua conta. Ele expira em 5 minutos.";
                break;
            default:
                throw new Error(`Tipo de token inválido ou não suportado para envio de email: ${tipo}`);
        }

        const corpoHtml = `
            <div class="email__token-box">
                <span class="email__token">${token}</span>
            </div>
            <p class="email__instructions">
                ${instructions}
            </p>
        `;

        let html = template
            .replace("{{Title}}", title)
            .replace("{{Subtitle}}", subtitle);
            
        html = this.substituirVariaveisDoTemplate(html, corpoHtml);

        // Chama o método privado para realizar o envio
        await this.enviarEmail(usuario, html);
    }

    // --- Métodos Privados da Classe ---

    private selecionarTemplate(tipo: string): string {
        switch (tipo) {
            case 'OTP':
                const otpTemplatePath = path.join(__dirname, "../../templates/otpTemplate.html");
                return fs.readFileSync(otpTemplatePath, "utf-8");
            case 'LEMBRETE':
                this.subject = `Seu lembrete de aniversários chegou!`;
                const templatePath = path.join(__dirname, "../../templates/todayTemplate.html");
                return fs.readFileSync(templatePath, "utf-8");
            default:
                throw new Error(`Tipo de template desconhecido: ${tipo}`);
        }
    }

    private substituirVariaveisDoTemplate(template: string, aniversariosUl: string): string {
        return template.replace("{{Beggining}}", aniversariosUl);
    }

    private async enviarEmail(user: IPessoa, htmlContent: string): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: this.subject,
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