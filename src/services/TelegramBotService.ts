import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import readline from "readline";
import dotenv from "dotenv";

// Importações dos modelos e tipos da nossa arquitetura
import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";
import type { INotificationProvider, UsuarioComAniversarios } from "../types/NotificationTypes";

dotenv.config();

// Tipos auxiliares locais
interface ParsedCommand {
    command: string;
    args: string[];
}

// O GramJS costuma lidar com IDs como números grandes (BigInt) ou strings
type ChatId = string | number | bigint;

export class TelegramBotService implements INotificationProvider {
    private client: TelegramClient | null;
    private session: StringSession;

    constructor() {
        this.client = null;
        this.session = new StringSession(process.env.STRING_SESSION || "");
    }

    public async send(usuarios: UsuarioComAniversarios[]): Promise<void> {
        usuarios = usuarios.filter(u => u.user.chatId !== null) // Filtra apenas usuários com chatId definido

        
    }

    // ==========================================
    // MÉTODOS DE INICIALIZAÇÃO E SETUP DA API
    // ==========================================
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

    // ==========================================
    // PROCESSAMENTO DE MENSAGENS E COMANDOS
    // ==========================================
    private async handleMessage(event: any): Promise<void> {
        const message = event.message;
        
        if (!this.isValidMessage(message)) return;

        const { command, args } = this.parseCommand(message.message);
        
        // Extração segura do ID do Chat baseado na estrutura da API do GramJS
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
                await this.handleBindCommand(chatId, args[0] || "");
                break;
            default:
                await this.sendMessage(chatId, "Comando não reconhecido. Tente enviar /start");
                break;
        }
    }

    // ==========================================
    // REGRAS DE NEGÓCIO DOS COMANDOS
    // ==========================================
    private async handleStartCommand(chatId: ChatId): Promise<void> {
        const message = `Olá, muito obrigado por escolher o Birthday Reminder! 🎉
Você está a um passo de receber seus lembretes pelo Telegram também!
Para isso, digite [/bind seu-email@example.com] usando o email da sua conta cadastrada na plataforma.`;

        await this.sendMessage(chatId, message);
    }

    private async handleBindCommand(chatId: ChatId, email: string): Promise<void> {
        if (!email) {
            await this.sendMessage(chatId, "Por favor, forneça um email. Exemplo: /bind seu-email@example.com");
            return;
        }

        try {
            // Buscamos o usuário no MongoDB através do modelo Pessoa
            const usuario = await Pessoa.findOne({ email }) as IPessoa;
            
            if (!usuario) {
                await this.sendMessage(chatId, "Email não encontrado na base de dados do sistema.");
                return;
            }

            // Atribuímos o chatId convertendo para string, garantindo conformidade com o Banco
            usuario.chatId = chatId.toString();
            await usuario.save();
            
            await this.sendMessage(chatId, "Conta do Telegram vinculada com sucesso! Você começará a receber as notificações aqui.");
        } catch (error) {
            console.error("Erro ao vincular conta:", error);
            await this.sendMessage(chatId, "Ocorreu um erro interno ao tentar vincular sua conta.");
        }
    }

    // ==========================================
    // FUNÇÕES UTILITÁRIAS
    // ==========================================
    private async sendMessage(chatId: ChatId, message: string): Promise<void> {
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

// Exporta uma única instância para ser consumida pelo NotificationJob
export const telegramBotService = new TelegramBotService();