import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Token, { TokenType } from './src/models/Token';
import Pessoa from './src/models/Pessoa';
import { tokenService } from './src/services/TokenService';
import { emailService } from './src/services/EmailService';

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/birthday');
        console.log("Connected");
        
        const p = await Pessoa.findOne();
        if(!p) { console.log("no user"); return;}
        
        console.log("User found:", p.id);
        
        const bindToken = await tokenService.generateToken(p._id, TokenType.TELEGRAM_BIND);
        console.log("Generated token:", bindToken);
        
        console.log("--- Testando Error no EmailService ---");
        try {
            await emailService.enviarToken(p, "123456", "INVALID_TYPE" as any);
            console.error("Falha: Deveria ter lançado um erro!");
        } catch(e: any) {
            console.log("Sucesso: Erro de tipo inválido capturado corretamente ->", e.message);
        }

        console.log("--- Testando EmailService com usuário sem e-mail ---");
        const oldEmail = p.email;
        p.email = ""; // simula usuário sem email
        await emailService.enviarToken(p, "123456", TokenType.TELEGRAM_BIND);
        console.log("Sucesso: Nenhuma exceção lançada, a rotina retornou preventivamente.");
        p.email = oldEmail; // restaura
        
        await mongoose.disconnect();
    } catch(e) {
        console.error("ERROR:", e);
    }
}

test();
