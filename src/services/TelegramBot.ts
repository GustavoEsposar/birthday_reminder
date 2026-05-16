import TelegramBotAPI from "node-telegram-bot-api";
import dotenv from "dotenv";

import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";
import { tokenService } from "./TokenService";
import { TokenType } from "../models/Token";
import type { TTelegramDados } from "../types/TTelegramDados";
import { logger } from "../utils/logger";

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
            logger.warn('[TELEGRAM] TELEGRAM_TOKEN não encontrado no .env. Bot não iniciado.');
            return;
        }

        this.bot = new TelegramBotAPI(token, { polling: true });

        this.setupEventHandlers();
        console.log("[TELEGRAM] Bot do Telegram iniciado ✅");
    }

    // ==========================================
    // MÉTODOS PÚBLICOS DE ENVIO
    // ==========================================
    
    // Atualizamos a assinatura para aceitar o objeto de opções (como o parse_mode)
    public async sendMessage(
        chatId: ChatId, 
        message: string, 
        options: TelegramBotAPI.SendMessageOptions = {} 
    ): Promise<void> {
        if (!this.bot) {
            logger.warn('Tentativa de envio de mensagem sem o cliente Telegram inicializado.');
            return;
        }
        
        try {
            // REPASSE O OBJETO 'options' para o bot real aqui:
            await this.bot.sendMessage(chatId, message, options);
        } catch (error) {
            logger.error(`Falha ao enviar mensagem do Telegram para chatId ${chatId}:`, error);
        }
    }

    public async sendConfirmationMessage(chatId:ChatId, dados:TTelegramDados): Promise<void> {
        const message = `🎂 <b>${dados.firstName}</b>, novo aniversário aguardando aprovação!\n\n` +
            `<b>Nome:</b> ${dados.name}\n` +
            `<b>Data:</b> ${dados.day}/${dados.month}/${dados.year}\n\n` +
            `Acesse seu painel para aprovar ou rejeitar.`;

        await this.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE INFRAESTRUTURA
    // ==========================================
    private setupEventHandlers(): void {
        if (!this.bot) return;

        this.bot.on('text', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text || "";
            const [command, ...args] = text.trim().split(/\s+/);

            try {
                await this.executeCommand(command || "", chatId, args);
            } catch (error) {
                logger.error('Erro interno ao processar comando:', error);
                await this.sendMessage(chatId, "Ocorreu um erro ao processar sua solicitação.");
            }
        });
    }

    private async executeCommand(command: string, chatId: ChatId, args: string[]): Promise<void> {
        switch (command) {
            case '/start':
                await this.handleStartCommand(chatId);
                break;
            case '/bind':
                await this.handleBindCommand(chatId, args[0] || "", args[1] || "");
                break;
            default:
                await this.sendMessage(chatId, "Comando não reconhecido. Tente enviar /start");
                break;
        }
    }

    private async handleStartCommand(chatId: ChatId): Promise<void> {
        // Exemplo usando negrito em HTML
        const message = `Olá, muito obrigado por escolher o <b>Birthday Reminder</b>! 🎉\n\nVocê está a um passo de receber os seus lembretes pelo Telegram!\nPara isso, gere o seu token no painel web e digite: \n\n<code>/bind seu-email@example.com SEU-TOKEN</code>`;
        
        await this.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    private async handleBindCommand(chatId: ChatId, email: string, token: string): Promise<void> {
        if (!email || !token) {
            await this.sendMessage(chatId, "Por favor, forneça o email e o token. \nExemplo: <code>/bind seu-email@example.com 8F4A2B</code>", { parse_mode: "HTML" });
            return;
        }

        try {
            const usuario = await Pessoa.findOne({ email }) as IPessoa;
            
            if (!usuario) {
                await this.sendMessage(chatId, "Email não encontrado na base de dados do sistema.");
                return;
            }

            const isValidToken = await tokenService.validateToken(usuario._id, token, TokenType.TELEGRAM_BIND);
            if (!isValidToken) {
                await this.sendMessage(chatId, "Token inválido ou expirado.");
                return;
            }

            usuario.chatId = chatId.toString();
            await usuario.save();
            
            await tokenService.deleteToken(usuario._id, TokenType.TELEGRAM_BIND);
            
            // Usando negrito HTML na confirmação
            await this.sendMessage(chatId, `✅ Sucesso! A conta de <b>${usuario.name}</b> foi vinculada.`, { parse_mode: "HTML" });
        } catch (error) {
            logger.error('Erro ao vincular conta:', error);
            await this.sendMessage(chatId, "Ocorreu um erro interno.");
        }
    }
}

export const telegramBot = new TelegramBot();