import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Token from './src/models/Token';
import Pessoa from './src/models/Pessoa';
import { tokenService } from './src/services/TokenService';

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/birthday');
        console.log("Connected");
        
        const p = await Pessoa.findOne();
        if(!p) { console.log("no user"); return;}
        
        console.log("User found:", p.id);
        
        const bindToken = await tokenService.generateToken(p._id, TokenType.TELEGRAM_BIND);
        console.log("Generated token:", bindToken);
        
        await mongoose.disconnect();
    } catch(e) {
        console.error("ERROR:", e);
    }
}

test();
