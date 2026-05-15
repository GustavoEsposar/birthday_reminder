import crypto from 'crypto';
import mongoose from 'mongoose';
import InviteLink, { IInviteLink } from '../models/InviteLink';

const DURATION_MAP: Record<string, number> = {
    '24h':  24,
    '3d':   72,
    '7d':   168,
    '30d':  720
};

export class InviteLinkService {
    async generateLink(userId: string | mongoose.Types.ObjectId, duration: string): Promise<IInviteLink> {
        const hours = DURATION_MAP[duration];
        if (!hours) throw new Error(`Duração inválida: ${duration}`);

        // Invalida link anterior se existir
        await InviteLink.deleteMany({ userId });

        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        const tryInsert = async (attemptsLeft: number): Promise<IInviteLink> => {
            const token = crypto.randomBytes(8).toString('hex');
            try {
                const link = new InviteLink({ userId, token, expiresAt });
                await link.save();
                return link;
            } catch (error) {
                if (error.code === 11000 && attemptsLeft > 1) {
                    return tryInsert(attemptsLeft - 1);
                }
                throw error;
            }
        };

        return tryInsert(3);
    }

    async findActiveByToken(token: string): Promise<IInviteLink | null> {
        return InviteLink.findOne({ token, expiresAt: { $gt: new Date() } });
    }

    async findActiveByUser(userId: string | mongoose.Types.ObjectId): Promise<IInviteLink | null> {
        return InviteLink.findOne({ userId, expiresAt: { $gt: new Date() } });
    }

    async cancelLink(userId: string | mongoose.Types.ObjectId): Promise<void> {
        await InviteLink.deleteMany({ userId });
    }
}

export const inviteLinkService = new InviteLinkService();
