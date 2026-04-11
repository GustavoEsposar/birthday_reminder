import TelegramBotAPI from "node-telegram-bot-api";
import dotenv from "dotenv";

import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";

dotenv.config();

export type ChatId = string | number;

export class TelegramBot {
    private bot: TelegramBotAPI | null;

    constructor() {
        this.bot = null;
    }

    public initialize(): void {
        const token = process.env.TELEGRAM_TOKEN;
        
        if (!token) {
            console.error("[TELEGRAM] AVISO: TELEGRAM_TOKEN não encontrado no .env. Bot não iniciado.");
            return;
        }

        // 'polling: true' faz o bot verificar ativamente por novas mensagens
        this.bot = new TelegramBotAPI(token, { polling: true });

        this.setupEventHandlers();
        console.log("[TELEGRAM] Bot do Telegram iniciado ✅");
    }

    // ==========================================
    // MÉTODOS PÚBLICOS DE ENVIO (Usado pelos Services)
    // ==========================================
    public async sendMessage(chatId: ChatId, message: string, p0: { parse_mode: string; }): Promise<void> {
        if (!this.bot) {
            console.error("Tentativa de envio de mensagem sem o cliente Telegram inicializado.");
            return;
        }
        
        try {
            await this.bot.sendMessage(chatId, message);
        } catch (error) {
            console.error(`Falha ao enviar mensagem do Telegram para ${chatId}:`, error);
        }
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE INFRAESTRUTURA
    // ==========================================
    private setupEventHandlers(): void {
        if (!this.bot) return;

        // Escuta qualquer mensagem de texto que o bot receber
        this.bot.on('text', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text || "";

            // Separa o texto em "comando" e "argumentos"
            const [command, ...args] = text.trim().split(" ");

            try {
                await this.executeCommand(command || "", chatId, args);
            } catch (error) {
                console.error("Erro interno ao processar comando:", error);
                await this.sendMessage(chatId, "Ocorreu um erro ao processar sua solicitação.",{
                    parse_mode: "Markdownv2",
                });
            }
        });
    }

    private async executeCommand(command: string, chatId: ChatId, args: string[]): Promise<void> {
        switch (command) {
            case '/start':
                await this.handleStartCommand(chatId);
                break;
            case '/bind':
                // args[0] = email, args[1] = token
                await this.handleBindCommand(chatId, args[0] || "", args[1] || "");
                break;
            default:
                await this.sendMessage(chatId, "Comando não reconhecido. Tente enviar /start",{
                    parse_mode: "Markdownv2",
                });
                break;
        }
    }

    private async handleStartCommand(chatId: ChatId): Promise<void> {
        const message = `Olá, muito obrigado por escolher o Birthday Reminder! 🎉\nVocê está a um passo de receber os seus lembretes pelo Telegram também!\nPara isso, gere o seu token no painel web e digite: \n\n/bind seu-email@example.com SEU-TOKEN`;
        await this.sendMessage(chatId, message, {
                parse_mode: "Markdownv2",
            });
    }

    private async handleBindCommand(chatId: ChatId, email: string, token: string): Promise<void> {
        if (!email || !token) {
            await this.sendMessage(chatId, "Por favor, forneça o email e o token. \nExemplo: /bind seu-email@example.com TKG-ABCDEF",{
                parse_mode: "Markdownv2",
            });
            return;
        }

        try {
            const usuario = await Pessoa.findOne({ email }) as IPessoa;
            
            if (!usuario) {
                await this.sendMessage(chatId, "Email não encontrado na base de dados do sistema.",{
                    parse_mode: "Markdownv2",
                });
                return;
            }

            if (!usuario.telegramBindToken || usuario.telegramBindToken !== token) {
                await this.sendMessage(chatId, "Token inválido ou expirado. Verifique os dados ou gere um novo token no painel web.",{
                    parse_mode: "Markdownv2",
                });
                return;
            }

            usuario.chatId = chatId.toString();
            usuario.telegramBindToken = null; // Invalida o token após uso
            await usuario.save();
            
            await this.sendMessage(chatId, `✅ Sucesso! A conta de ${usuario.name} foi vinculada com sucesso. Passará a receber as notificações aqui.`,{
                parse_mode: "Markdownv2",
            });
        } catch (error) {
            console.error("Erro ao vincular conta:", error);
            await this.sendMessage(chatId, "Ocorreu um erro interno ao tentar vincular a sua conta.",{
                parse_mode: "Markdownv2",
            });
        }
    }
}

// Função auxiliar para escapar caracteres especiais do Markdownv2V2
const escapeMarkdownv2 = (text) => {
    return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
};

// Exportamos a instância do Bot
export const telegramBot = new TelegramBot();