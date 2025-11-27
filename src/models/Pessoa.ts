import mongoose from 'mongoose';
import { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBirthdate {
    name: string;
    date: Date;
}

export interface IPessoa extends Document {
    name: string;
    birth: Date;
    email: string;
    password: string;
    birthdates: IBirthdate[];
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const pessoaSchema = new Schema<IPessoa>({
    name: {
        type: String,
        required: true
    },
    birth: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true 
    },
    birthdates: [{
        name: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        }
    }]
}, { collection: 'contas' });

// Middleware para criptografar a senha antes de salvar
pessoaSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

// Método para comparar a senha fornecida com a senha armazenada
pessoaSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

const Pessoa = mongoose.model<IPessoa>('Pessoa', pessoaSchema);
export default Pessoa;