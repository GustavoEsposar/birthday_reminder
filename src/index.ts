
import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import cron from "node-cron";
import dotenv from "dotenv";

import connectDB from "./db/db.js";
import { enviarLembretePorEmail } from "./services/emailService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const timezone = "America/Sao_Paulo";

// Conectar ao banco de dados
connectDB();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Sessões
app.use(
    session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI as string,
        }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 dia
    })
)

/*          Rotas
=============================================================================================
*/
import homeRoute from "./routes/homeRoute.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mobileRoutes from "./routes/mobileRoutes.js";

app.use(homeRoute);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(mobileRoutes);
/*          
=============================================================================================
*/

// Cron jobs
cron.schedule(
    "0 5 * * *",
    async () => {
        const envios = [
            { dias: 0, frase: " - HOJE" },
            { dias: 1, frase: " - Em 1 dia" },
            { dias: 2, frase: " - Em 2 dias" },
            { dias: 7, frase: " - Em 7 dias" }
        ];

        for (const envio of envios) {
            await enviarLembretePorEmail(envio.dias, envio.frase);
        }
    },
    { timezone }
);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));