import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import readline from "readline";
import dotenv from "dotenv";

import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";

dotenv.config();

interface ParsedCommand {
    command: string;
    args: string[];
}

export type ChatId = string | number | bigint;

export class TelegramBot {
    private client: TelegramClient | null;
    private session: StringSession;

    constructor() {
        this.client = null;
        this.session = new StringSession(process.env.STRING_SESSION || "");
    }

    public async initialize(): Promise<void> {
        this.client = new TelegramClient(
            this.session,
            parseInt(process.env.API_ID || "0"),
            process.env.API_HASH || "",
            { connectionRetries: 5 }
        );

        await this.startClient();
        await this.setupEventHandlers();

        console.log("[TELEGRAM] Bot do Telegram iniciado ✅");
        
        if (this.client) {
            console.log("[TELEGRAM] STRING_SESSION =", this.client.session.save());
        }
    }

    // ==========================================
    // MÉTODOS PÚBLICOS DE ENVIO (Usado pelos Services)
    // ==========================================
    public async sendMessage(chatId: ChatId, message: string): Promise<void> {
        if (!this.client) {
            console.error("Tentativa de envio de mensagem sem o cliente Telegram inicializado.");
            return;
        }
        
        try {
            await this.client.sendMessage(Number(chatId), { message });
        } catch (error) {
            console.error(`Falha ao enviar mensagem do Telegram para ${chatId}:`, error);
        }
    }

    // ==========================================
    // MÉTODOS PRIVADOS DE INFRAESTRUTURA
    // ==========================================
    private async startClient(): Promise<void> {
        if (!this.client) return;

        await this.client.start({
            phoneNumber: async () => process.env.PHONE_NUMBER || "",
            password: async () => "",
            phoneCode: async () => {
                const code = await this.askQuestion("Digite o código recebido no Telegram: ");
                return code.trim();
            },
            onError: (err: Error) => console.error("Erro ao iniciar cliente do Telegram:", err),
        });
    }

    private async setupEventHandlers(): Promise<void> {
        if (!this.client) return;

        this.client.addEventHandler(async (event: any) => {
            await this.handleMessage(event);
        }, new NewMessage({}));
    }

    private async handleMessage(event: any): Promise<void> {
        const message = event.message;
        if (!this.isValidMessage(message)) return;

        const { command, args } = this.parseCommand(message.message);
        const chatId: ChatId = message.peerId?.userId || message.senderId?.value;

        if (chatId) {
            await this.executeCommand(command, chatId, args);
        }
    }

    private isValidMessage(message: any): boolean {
        return message && typeof message.message === "string";
    }

    private parseCommand(text: string): ParsedCommand {
        const [command, ...args] = text.trim().split(" ");
        return { command: command || "", args };
    }

    private async executeCommand(command: string, chatId: ChatId, args: string[]): Promise<void> {
        switch (command) {
            case '/start':
                await this.handleStartCommand(chatId);
                break;
            case '/bind':
                // Passamos args[0] (email) e args[1] (token)
                await this.handleBindCommand(chatId, args[0] || "", args[1] || "");
                break;
            default:
                await this.sendMessage(chatId, "Comando não reconhecido. Tente enviar /start");
                break;
        }
    }

    private async handleStartCommand(chatId: ChatId): Promise<void> {
        const message = `Olá, muito obrigado por escolher o Birthday Reminder! 🎉\nVocê está a um passo de receber os seus lembretes pelo Telegram também!\nPara isso, gere o seu token no painel web e digite: \n\n[/bind seu-email@example.com SEU-TOKEN]`;
        await this.sendMessage(chatId, message);
    }

    private async handleBindCommand(chatId: ChatId, email: string, token: string): Promise<void> {
        if (!email || !token) {
            await this.sendMessage(chatId, "Por favor, forneça o email e o token. \nExemplo: /bind seu-email@example.com TKG-ABCDEF");
            return;
        }

        try {
            // 1. Busca o utilizador no MongoDB através do email
            const usuario = await Pessoa.findOne({ email }) as IPessoa;
            
            if (!usuario) {
                await this.sendMessage(chatId, "Email não encontrado na base de dados do sistema.");
                return;
            }

            // 2. Valida se o utilizador possui um token gerado e se coincide com o informado
            if (!usuario.telegramBindToken || usuario.telegramBindToken !== token) {
                await this.sendMessage(chatId, "Token inválido ou expirado. Verifique os dados ou gere um novo token no painel web.");
                return;
            }

            // 3. Atribui o chatId convertendo para string
            usuario.chatId = chatId.toString();
            
            // 4. Limpa o token para garantir que seja de uso único (One-Time-Use)
            usuario.telegramBindToken = null;

            await usuario.save();
            
            await this.sendMessage(chatId, `✅ Sucesso! A conta de ${usuario.name} foi vinculada com sucesso. Passará a receber as notificações aqui.`);
        } catch (error) {
            console.error("Erro ao vincular conta:", error);
            await this.sendMessage(chatId, "Ocorreu um erro interno ao tentar vincular a sua conta.");
        }
    }

    private async askQuestion(query: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve) => {
            rl.question(query, (ans) => {
                rl.close();
                resolve(ans);
            });
        });
    }
}

// Exportamos a instância do Bot para ser inicializada no index.ts
export const telegramBot = new TelegramBot();