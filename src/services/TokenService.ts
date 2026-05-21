import Token, { TokenType } from '../models/Token';
import crypto from 'crypto';
import mongoose from 'mongoose';

export class TokenService {
    async generateToken(userId: string | mongoose.Types.ObjectId, type: TokenType, payload?: string): Promise<string> {
        // Exclui token anterior do mesmo tipo para o usuário, se houver
        await Token.deleteMany({ userId, type });

        const tryInsert = async (attemptsLeft: number): Promise<string> => {
            // Gera um token aleatório de 6 caracteres hexadecimais (ex: 8F4A2B)
            const finalToken = crypto.randomBytes(3).toString("hex").toUpperCase();
            try {
                const tokenDoc = new Token({
                    userId,
                    token: finalToken,
                    type,
                    payload
                });
                await tokenDoc.save();
                return finalToken;
            } catch (error) {
                if (error.code === 11000 && attemptsLeft > 1) {
                    return tryInsert(attemptsLeft - 1);
                }
                throw error;
            }
        };

        return tryInsert(3);
    }

    async validateToken(userId: string | mongoose.Types.ObjectId, token: string, type: TokenType): Promise<boolean> {
        const foundToken = await Token.findOne({ userId, token, type });
        return !!foundToken;
    }

    async deleteToken(userId: string | mongoose.Types.ObjectId, type: TokenType): Promise<void> {
        await Token.deleteMany({ userId, type });
    }
}

export const tokenService = new TokenService();
