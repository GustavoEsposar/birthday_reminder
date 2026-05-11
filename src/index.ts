import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import cron from "node-cron";
import { telegramBot } from "./services/TelegramBot";
import connectDB from "./db/db";

// Importar o orquestrador isolado
import { executarEnvioDiario, executarEnvioDiarioEmLotes } from "./jobs/notificationJob";

const app = express();
const PORT = process.env.PORT || 3003;
const timezone = "America/Sao_Paulo";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Conectar ao banco de dados
connectDB();

// Sessões de usuários web
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
import homeRoute from "./routes/homeRoute";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import mobileRoutes from "./routes/mobileRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import publicInviteRoutes from "./routes/publicInviteRoutes";

app.use(homeRoute);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(mobileRoutes);
app.use(inviteRoutes);
app.use(publicInviteRoutes);
/*          
=============================================================================================
*/

telegramBot.initialize();

// Cron jobs
cron.schedule(
    "0 5 * * *",
    async () => {
        await executarEnvioDiarioEmLotes();
        //await executarEnvioDiario();
    },
    { timezone }
);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));