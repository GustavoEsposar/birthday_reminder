import Pessoa, { NotificationChannel } from '../models/Pessoa';
import type { Request, Response } from 'express';
import { tokenService } from '../services/TokenService';
import { emailService } from '../services/EmailService';
import { TokenType } from '../models/Token';

export class SettingsController {
    public async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const user = await Pessoa.findById(req.session.userId);
            res.render('dashboard-settings', {
                title: 'Birthday Reminder - Configurações',
                user: user,
                extraScripts: ['/js/navbar-dashboard.js', '/js/settings.js', '/js/toast.js', '/js/password-toggle.js']
            });
        } catch (error) {
            res.status(500).send('Erro ao carregar as configurações');
        }
    }

    async updateNotificationSchedule(req: Request, res: Response) {
        try {
            const { cronValues } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            usuario.cron = cronValues;
            await usuario.save();

            res.status(200).json({ message: 'Preferências salvas com sucesso!' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar a programação de notificações' });
        }
    }

    async updateNotificationChannels(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            let { channels } = req.body;

            // Proteção: Garante que channels seja sempre um array
            if (!channels) channels = [];
            if (!Array.isArray(channels)) channels = [channels];

            // Regra de Negócio 1
            if (channels.length === 0) {
                return res.status(400).json({ error: "Você deve manter ao menos um canal de notificação ativo." });
            }

            const user = await Pessoa.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            // Regra de Negócio 2
            if (channels.includes(NotificationChannel.TELEGRAM) && !user.chatId) {
                return res.status(403).json({ error: "Vínculo do Telegram ausente. Não é possível ativar este canal." });
            }

            user.notificationChannels = channels;
            await user.save();

            return res.status(200).json({ 
                message: "Canais atualizados com sucesso!", 
                notificationChannels: user.notificationChannels 
            });

        } catch (error) {
            console.error("Erro ao atualizar canais de notificação:", error);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async updateAccountPassword(req: Request, res: Response) {}

    async generateDeleteToken(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.session as any).userId;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            const deleteToken = await tokenService.generateToken(usuario._id, TokenType.ACCOUNT_DELETION);
            await emailService.enviarToken(usuario, deleteToken, TokenType.ACCOUNT_DELETION);

            res.status(200).json({ message: "Token gerado com sucesso. Verifique seu e-mail." });
        } catch (error) {
            console.error("Erro ao gerar token de deleção de conta:", error);
            res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async deleteAccount(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.session as any).userId;
            const { token } = req.body;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            if (!token) {
                res.status(400).json({ error: "O token é obrigatório." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            const isValidToken = await tokenService.validateToken(usuario._id, token, TokenType.ACCOUNT_DELETION);
            if (!isValidToken) {
                res.status(400).json({ error: "Token inválido ou expirado." });
                return;
            }

            await tokenService.deleteToken(usuario._id, TokenType.ACCOUNT_DELETION);
            await Pessoa.findByIdAndDelete(usuario._id);

            req.session.destroy((err) => {
                if (err) console.error("Erro ao destruir sessão:", err);
            });

            res.status(200).json({ message: "Conta excluída com sucesso." });
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            res.status(500).json({ error: "Erro interno do servidor ao excluir conta." });
        }
    }
}

export const settingsController = new SettingsController();