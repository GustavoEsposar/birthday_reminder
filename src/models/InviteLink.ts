import mongoose, { Schema, Document } from 'mongoose';

export interface IInviteLink extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

const inviteLinkSchema = new Schema<IInviteLink>({
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
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const InviteLink = mongoose.model<IInviteLink>('InviteLink', inviteLinkSchema);
export default InviteLink;
