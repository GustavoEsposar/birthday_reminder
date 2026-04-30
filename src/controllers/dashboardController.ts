import Pessoa, { NotificationChannel } from '../models/Pessoa';
import type { Request, Response, NextFunction } from 'express';
import crypto from "crypto";
import mongoose from 'mongoose';
import { emailService } from '../services/EmailService';
import { tokenService } from '../services/TokenService';
import { TokenType } from '../models/Token';

export class DashboardController {
    async getDashboard(req : Request, res: Response): Promise<void> {
        try {
            const user = await Pessoa.findById(req.session.userId);
            res.render('dashboard', {
                title: 'Birthday Reminder - Dashboard',
                user: user,
                extraScripts: ['/js/navbar-dashboard.js', '/js/dashboard.js', '/js/toast.js']
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao carregar o dashboard' });
        }
    }

    async addBirthdate(req: Request, res: Response): Promise<void> {
        try {
            const { name, birthdate } = req.body;

            const novoAniversario = {
                _id: new mongoose.Types.ObjectId(), // Gera um ID único para o aniversário
                name,
                date: birthdate
            }
            await Pessoa.updateOne(
                { _id: req.session.userId },
                { $push: { birthdates: novoAniversario } }
            );
            res.status(200).json({ message: 'Aniversário adicionado com sucesso!', birthdate: novoAniversario });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao adicionar aniversário' });
        }
    }

    async deleteBirthdate(req: Request, res: Response): Promise<void> {
        try {
            const { birthdateId } = req.body;
            await Pessoa.updateOne(
                { _id: req.session.userId },
                { $pull: { birthdates: { _id: birthdateId } } }
            );
            res.status(200).json({ message: 'Aniversário deletado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao deletar aniversário' });
        }
    }

    async generateTelegramToken(req: Request, res: Response): Promise<void> {
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

            if (usuario.chatId !== null) {
                res.status(404).json({ error: "Usuário já possui telegram vinculado." });
                return;
            }

            const bindToken = await tokenService.generateToken(usuario._id, TokenType.TELEGRAM_BIND);

            usuario.notificationChannels = usuario.notificationChannels.includes(NotificationChannel.TELEGRAM) ? usuario.notificationChannels : [...usuario.notificationChannels, NotificationChannel.TELEGRAM];
            await usuario.save();

             // retorna sucesso e envia token por email
            await emailService.enviarTokenDoTelegram(usuario, bindToken);
            res.status(200).json(
                { message: "Token gerado com sucesso. Verifique seu email para o próximo passo." }
            );

        } catch (error) {
            console.error("Erro ao gerar token do Telegram:", error);
            res.status(500).json({ error: "Erro interno do servidor." });
        }
    }

    async revokeTelegram(req: Request, res:Response): Promise<void> {
        try {
            const userId = (req.session as any).userId;
            console.log('teste')

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            usuario.chatId = null;
            
            usuario.notificationChannels = usuario.notificationChannels.filter(
                channel => channel !== NotificationChannel.TELEGRAM
            );

            if (usuario.notificationChannels.length === 0) {
                usuario.notificationChannels.push(NotificationChannel.EMAIL);
            }

            await usuario.save();

            res.status(200).json(
                { message: "Telegram desvinculado com sucesso." }
            );
        } catch (error) {
            console.error("Erro ao desvinular token do Telegram:", error);
            res.status(500).json({ error: "Erro interno do servidor ao desvincular." });
        }
    }
}

export const dashboardController = new DashboardController();