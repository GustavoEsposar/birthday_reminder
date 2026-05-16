import mongoose, { Schema, Document } from 'mongoose';

export enum TokenType {
    TELEGRAM_BIND = 'TELEGRAM_BIND',
    PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
    ACCOUNT_DELETION = 'ACCOUNT_DELETION',
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'
}

export interface IToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    type: TokenType;
    createdAt: Date;
}

const tokenSchema = new Schema<IToken>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Pessoa'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: Object.values(TokenType),
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 300 segundos = 5 minutos
    }
});

const Token = mongoose.model<IToken>('Token', tokenSchema);
export default Token;
