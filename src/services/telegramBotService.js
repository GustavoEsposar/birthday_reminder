import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl/index.js";
import readline from "readline";
import dotenv from "dotenv";
import { User } from '../models/User';

dotenv.config();

class TelegramBotService {
    constructor() {
        this.client = null;
        this.session = new StringSession(process.env.STRING_SESSION || "");
    }

    async initialize() {
        this.client = new TelegramClient(
            this.session,
            parseInt(process.env.API_ID),
            process.env.API_HASH,
            { connectionRetries: 5 }
        );

        await this.startClient();
        await this.setupEventHandlers();
        
        console.log("Bot do Telegram iniciado ✅");
        console.log("STRING_SESSION =", this.client.session.save());
    }

    async startClient() {
        await this.client.start({
            phoneNumber: async () => process.env.PHONE_NUMBER,
            password: async () => "",
            phoneCode: async () => {
                const code = await this.askQuestion("Digite o código recebido no Telegram: ");
                return code.trim();
            },
            onError: (err) => console.error("Erro ao iniciar cliente:", err),
        });
    }

    async setupEventHandlers() {
        this.client.addEventHandler(async (event) => {
            await this.handleMessage(event);
        }, new Api.UpdateNewMessage());
    }

    async handleMessage(event) {
        const message = event.message;
        if (!this.isValidMessage(message)) return;

        const { command, args } = this.parseCommand(message.message);
        const chatId = message.peerId.userId || message.senderId?.value;

        await this.executeCommand(command, chatId, args);
    }

    isValidMessage(message) {
        return message && message.message;
    }

    parseCommand(text) {
        const [command, ...args] = text.split(" ");
        return { command, args };
    }

    async executeCommand(command, chatId, args) {
        const commands = {
            '/start': async () => await this.handleStartCommand(chatId),
            '/bind': async () => await this.handleBindCommand(chatId, args[0])
        };

        const handler = commands[command];
        if (handler) {
            await handler();
        } else {
            await this.sendMessage(chatId, "Comando não reconhecido.");
        }
    }

    async handleStartCommand(chatId) {
        const message = `Olá, muito obrigado por escolher o Birthday Reminder! 🎉
Você está a um passo de receber seus lembretes pelo Telegram também!
Para isso, digite [/bind seu-email@example.com] da sua conta cadastrada na plataforma.`;
        
        await this.sendMessage(chatId, message);
    }

    async handleBindCommand(chatId, email) {
        if (!email) {
            await this.sendMessage(chatId, "Por favor, forneça um email. Exemplo: /bind seu-email@example.com");
            return;
        }

        try {
            const usuario = await User.findOne({ email });
            if (!usuario) {
                await this.sendMessage(chatId, "Email não encontrado.");
                return;
            }

            usuario.chatId = chatId;
            await usuario.save();
            await this.sendMessage(chatId, "Conta Telegram vinculada com sucesso!");
        } catch (error) {
            console.error("Erro ao vincular conta:", error);
            await this.sendMessage(chatId, "Ocorreu um erro ao vincular sua conta.");
        }
    }

    async sendMessage(chatId, message) {
        await this.client.sendMessage(chatId, { message });
    }

    async askQuestion(query) {
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

// Exportar instância única do serviço
export const telegramBotService = new TelegramBotService();