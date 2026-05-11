import type { Request, Response } from 'express';
import Pessoa from '../models/Pessoa';
import PendingBirthdate from '../models/PendingBirthdate';
import { inviteLinkService } from '../services/InviteLinkService';
import { emailService } from '../services/EmailService';
import { telegramBot } from '../services/TelegramBot';
import { sanitizeString, isValidLength } from '../utils/sanitizer';
import type { TTelegramDados } from '../types/TTelegramDados';

export class PublicInviteController {
    async showForm(req: Request, res: Response): Promise<void> {
        try {
            const token = req.params.token as string;
            const link = await inviteLinkService.findActiveByToken(token);

            if (!link) {
                res.render('invite-expired', { title: 'Link Inválido - Birthday Reminder' });
                return;
            }

            const owner = await Pessoa.findById(link.userId);
            if (!owner) {
                res.render('invite-expired', { title: 'Link Inválido - Birthday Reminder' });
                return;
            }

            res.render('invite-form', {
                title: 'Birthday Reminder - Aniversário',
                ownerName: owner.name.trim().split(' ')[0],
                token
            });
        } catch (error) {
            console.error('Erro ao exibir formulário de convite:', error);
            res.status(500).send('Erro interno do servidor.');
        }
    }

    async showSuccess(req: Request, res: Response): Promise<void> {
        res.render('invite-success', { title: 'Enviado! - Birthday Reminder' });
    }

    async submitForm(req: Request, res: Response): Promise<void> {
        try {
            const token = req.params.token as string;
            const link = await inviteLinkService.findActiveByToken(token);

            if (!link) {
                res.status(410).json({ error: 'Este link expirou ou não existe.' });
                return;
            }

            let { name, birthdate } = req.body;
            name = sanitizeString(name);

            if (!name || !birthdate) {
                res.status(400).json({ error: 'Nome e data são obrigatórios.' });
                return;
            }

            if (!isValidLength(name, 1, 100)) {
                res.status(400).json({ error: 'O nome deve ter no máximo 100 caracteres.' });
                return;
            }

            const dateObj = new Date(birthdate);
            if (isNaN(dateObj.getTime())) {
                res.status(400).json({ error: 'Data inválida.' });
                return;
            }

            const pending = new PendingBirthdate({
                ownerId: link.userId,
                inviteLinkId: link._id,
                name,
                date: dateObj
            });
            await pending.save();

            // Notifica o dono do link
            const owner = await Pessoa.findById(link.userId);
            if (owner) {
                await this.notifyOwner(owner, pending);
            }

            res.status(200).json({ message: 'Enviado com sucesso!' });
        } catch (error) {
            console.error('Erro ao processar convite:', error);
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }

    private async notifyOwner(owner: any, pending: any): Promise<void> {
        const channels = owner.notificationChannels || [];

        if (channels.includes('email')) {
            await emailService.enviarNotificacaoPendente(owner, pending);
        }

        if (channels.includes('telegram') && owner.chatId) {
            const dados: TTelegramDados = {
                firstName: owner.name.trim().split(' ')[0],
                name: pending.name,
                date: new Date(pending.date),
                day: String(pending.date.getUTCDate()).padStart(2, '0'),
                month: String(pending.date.getUTCMonth() + 1).padStart(2, '0'),
                year: pending.date.getUTCFullYear()
            }

            await telegramBot.sendConfirmationMessage(owner.chatId, dados);
        }
    }
}

export const publicInviteController = new PublicInviteController();
