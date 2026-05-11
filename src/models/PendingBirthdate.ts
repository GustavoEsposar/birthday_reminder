import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingBirthdate extends Document {
    ownerId: mongoose.Types.ObjectId;
    inviteLinkId: mongoose.Types.ObjectId;
    name: string;
    date: Date;
    submittedAt: Date;
}

const pendingBirthdateSchema = new Schema<IPendingBirthdate>({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Pessoa'
    },
    inviteLinkId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'InviteLink'
    },
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const PendingBirthdate = mongoose.model<IPendingBirthdate>('PendingBirthdate', pendingBirthdateSchema);
export default PendingBirthdate;
