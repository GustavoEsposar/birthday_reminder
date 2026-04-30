import Pessoa from '../models/Pessoa';
import type { Request, Response, NextFunction } from 'express';
import crypto from "crypto";
import mongoose from 'mongoose';
import { emailService } from '../services/EmailService';

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

            // Gera um token aleatório de 6 caracteres hexadecimais (ex: 8F4A2B)
            const randomString = crypto.randomBytes(3).toString("hex").toUpperCase();
            const bindToken = `TKG-${randomString}`;

            usuario.telegramBindToken = bindToken;
            usuario.notificationChannels = usuario.notificationChannels.includes("telegram") ? usuario.notificationChannels : [...usuario.notificationChannels, "telegram"];
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