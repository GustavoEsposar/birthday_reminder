import mongoose from 'mongoose';

export default async function connectDB() : Promise<void> {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, {});
        console.log('Conectado ao MongoDB com sucesso');
    } catch (error) {
        console.log('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};