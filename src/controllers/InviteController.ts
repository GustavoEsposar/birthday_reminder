import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Pessoa from '../models/Pessoa';
import PendingBirthdate from '../models/PendingBirthdate';
import { inviteLinkService } from '../services/InviteLinkService';
import { sanitizeString, isValidLength } from '../utils/sanitizer';
import { logger } from '../utils/logger';

export class InviteController {
    async generateLink(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.session.userId as string;
            const { duration } = req.body;

            const validDurations = ['24h', '3d', '7d', '30d'];
            if (!duration || !validDurations.includes(duration)) {
                res.status(400).json({ error: 'Duração inválida. Use: 24h, 3d, 7d ou 30d.' });
                return;
            }

            const link = await inviteLinkService.generateLink(userId!, duration);
            const baseUrl = process.env.BASE_URL || 'http://localhost:3003';

            res.status(200).json({
                message: 'Link gerado com sucesso!',
                url: `${baseUrl}/invite/${link.token}`,
                expiresAt: link.expiresAt
            });
        } catch (error) {
            logger.error('Erro ao gerar link de convite:', error);
            res.status(500).json({ error: 'Erro interno ao gerar link.' });
        }
    }

    async cancelLink(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.session.userId as string;
            await inviteLinkService.cancelLink(userId);
            res.status(200).json({ message: 'Link cancelado com sucesso.' });
        } catch (error) {
            logger.error('Erro ao cancelar link:', error);
            res.status(500).json({ error: 'Erro interno ao cancelar link.' });
        }
    }

    async approvePending(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.session.userId as string;
            const pendingId = req.params.pendingId as string;

            if (!mongoose.Types.ObjectId.isValid(pendingId)) {
                res.status(400).json({ error: 'ID inválido.' });
                return;
            }

            const pending = await PendingBirthdate.findOne({ _id: pendingId, ownerId: userId });
            if (!pending) {
                res.status(404).json({ error: 'Entrada pendente não encontrada.' });
                return;
            }

            const novoAniversario = {
                _id: new mongoose.Types.ObjectId(),
                name: pending.name,
                date: pending.date
            };

            await Pessoa.updateOne(
                { _id: userId },
                { $push: { birthdates: novoAniversario } }
            );

            await PendingBirthdate.deleteOne({ _id: pendingId });

            res.status(200).json({
                message: `Aniversário de ${pending.name} aprovado!`,
                birthdate: novoAniversario
            });
        } catch (error) {
            logger.error('Erro ao aprovar pendente:', error);
            res.status(500).json({ error: 'Erro interno ao aprovar.' });
        }
    }

    async rejectPending(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.session.userId as string;
            const pendingId = req.params.pendingId as string;

            if (!mongoose.Types.ObjectId.isValid(pendingId)) {
                res.status(400).json({ error: 'ID inválido.' });
                return;
            }

            const result = await PendingBirthdate.deleteOne({ _id: pendingId, ownerId: userId });
            if (result.deletedCount === 0) {
                res.status(404).json({ error: 'Entrada pendente não encontrada.' });
                return;
            }

            res.status(200).json({ message: 'Entrada rejeitada.' });
        } catch (error) {
            logger.error('Erro ao rejeitar pendente:', error);
            res.status(500).json({ error: 'Erro interno ao rejeitar.' });
        }
    }
}

export const inviteController = new InviteController();
