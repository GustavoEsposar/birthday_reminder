import Pessoa, { NotificationChannel } from '../models/Pessoa';
import type { Request, Response } from 'express';
import { tokenService } from '../services/TokenService';
import { emailService } from '../services/EmailService';
import Token, { TokenType } from '../models/Token';
import { inviteLinkService } from '../services/InviteLinkService';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class SettingsController {
    public async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const [user, activeInviteLink] = await Promise.all([
                Pessoa.findById(req.session.userId),
                inviteLinkService.findActiveByUser(req.session.userId!)
            ]);
            const baseUrl = process.env.BASE_URL || 'http://localhost:3003';
            res.render('dashboard-settings', {
                title: 'Birthday Reminder - Configurações',
                user,
                activeInviteLink,
                baseUrl,
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
            logger.error("Erro ao atualizar canais de notificação:", error);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async generatePasswordChangeToken(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.session as any).userId;
            const { newPassword, newPasswordConfirm } = req.body;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            if (!newPassword || !newPasswordConfirm) {
                res.status(400).json({ error: "Todos os campos são obrigatórios." });
                return;
            }

            if (newPassword.length < 8 || newPassword.length > 64) {
                res.status(400).json({ error: "A nova senha deve ter entre 8 e 64 caracteres." });
                return;
            }

            if (newPassword !== newPasswordConfirm) {
                res.status(400).json({ error: "A nova senha e a confirmação não coincidem." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            const changeToken = await tokenService.generateToken(usuario._id, TokenType.PASSWORD_CHANGE, hashedNewPassword);
            await emailService.enviarToken(usuario, changeToken, TokenType.PASSWORD_CHANGE);

            res.status(200).json({ message: "Token enviado para seu e-mail." });
        } catch (error) {
            logger.error("Erro ao gerar token de alteração de senha:", error);
            res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async confirmPasswordChange(req: Request, res: Response): Promise<void> {
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

            const tokenDoc = await Token.findOne({ userId: usuario._id, token, type: TokenType.PASSWORD_CHANGE });
            if (!tokenDoc) {
                res.status(400).json({ error: "Token inválido ou expirado." });
                return;
            }

            const hashedNewPassword = tokenDoc.payload;
            if (!hashedNewPassword) {
                res.status(400).json({ error: "Erro interno: dados do token inválidos." });
                return;
            }

            // Atribui diretamente o hash pré-calculado, sem acionar o middleware de re-hash do Mongoose
            await Pessoa.findByIdAndUpdate(usuario._id, { password: hashedNewPassword });

            await tokenService.deleteToken(usuario._id, TokenType.PASSWORD_CHANGE);

            res.status(200).json({ message: "Senha alterada com sucesso." });
        } catch (error) {
            logger.error("Erro ao confirmar alteração de senha:", error);
            res.status(500).json({ error: "Erro interno do servidor ao alterar senha." });
        }
    }

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
            logger.error("Erro ao gerar token de deleção de conta:", error);
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
                if (err) logger.warn('Erro ao destruir sessão:', err);
            });

            res.status(200).json({ message: "Conta excluída com sucesso." });
        } catch (error) {
            logger.error("Erro ao excluir conta:", error);
            res.status(500).json({ error: "Erro interno do servidor ao excluir conta." });
        }
    }

    async generateChangeEmailToken(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.session as any).userId;
            const { newEmail } = req.body;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            if (!newEmail) {
                res.status(400).json({ error: "O novo e-mail é obrigatório." });
                return;
            }

            const existingUser = await Pessoa.findOne({ email: newEmail });
            if (existingUser) {
                res.status(400).json({ error: "Este e-mail já está em uso." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            const changeToken = await tokenService.generateToken(usuario._id, TokenType.EMAIL_CHANGE, newEmail);
            await emailService.enviarToken(usuario, changeToken, TokenType.EMAIL_CHANGE, newEmail);

            res.status(200).json({ message: "Token enviado para o novo e-mail." });
        } catch (error) {
            logger.error("Erro ao gerar token de alteração de e-mail:", error);
            res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async confirmChangeEmail(req: Request, res: Response): Promise<void> {
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

            const tokenDoc = await Token.findOne({ userId: usuario._id, token, type: TokenType.EMAIL_CHANGE });
            
            if (!tokenDoc) {
                res.status(400).json({ error: "Token inválido ou expirado." });
                return;
            }

            const newEmail = tokenDoc.payload;
            if (!newEmail) {
                res.status(400).json({ error: "Erro interno: E-mail não encontrado no token." });
                return;
            }

            usuario.email = newEmail;
            await usuario.save();

            await tokenService.deleteToken(usuario._id, TokenType.EMAIL_CHANGE);

            res.status(200).json({ message: "E-mail alterado com sucesso." });
        } catch (error) {
            logger.error("Erro ao alterar e-mail:", error);
            res.status(500).json({ error: "Erro interno do servidor ao alterar e-mail." });
        }
    }
}

export const settingsController = new SettingsController();