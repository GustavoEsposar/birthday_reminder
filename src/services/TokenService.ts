import Token, { TokenType } from '../models/Token';
import crypto from 'crypto';
import mongoose from 'mongoose';

export class TokenService {
    async generateToken(userId: string | mongoose.Types.ObjectId, type: TokenType): Promise<string> {
        // Exclui token anterior do mesmo tipo para o usuário, se houver
        await Token.deleteMany({ userId, type });

        // Gera um token aleatório de 6 caracteres hexadecimais (ex: 8F4A2B)
        const finalToken = crypto.randomBytes(3).toString("hex").toUpperCase();

        const tokenDoc = new Token({
            userId,
            token: finalToken,
            type
        });

        await tokenDoc.save();
        return finalToken;
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
