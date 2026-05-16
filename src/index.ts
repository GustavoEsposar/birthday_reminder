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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "mongo-sanitize";

// Importar o orquestrador isolado
import { executarEnvioDiario, executarEnvioDiarioEmLotes } from "./jobs/notificationJob";

const app = express();
const PORT = process.env.PORT || 3003;
const timezone = "America/Sao_Paulo";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // ajustar se usar CDN
        }
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3003'],
    credentials: true,
}));

// Proteção global contra NoSQL injection — remove operadores Mongo do req.body
app.use((req, _res, next) => {
    req.body = mongoSanitize(req.body);
    next();
});

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
        cookie: { maxAge: 1000 * 60 * 60 * 24,  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax'}, // 1 dia
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

// Rate limiter para login, registro e rotas de autenticação (brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
});

// Rate limiter mais restrito para endpoints que disparam e-mail (evita spam de custo)
const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de tentativas atingido. Aguarde 15 minutos.' },
});

// Rate limiter para submissões públicas via magic link (por IP)
const inviteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas submissões. Tente novamente mais tarde.' },
});

app.use(homeRoute);
app.use('/login', authLimiter);
app.use('/register', authLimiter);
app.use('/login/generate-recovery-token', recoveryLimiter);
app.use('/login/recovery', recoveryLimiter);
app.use('/register/verify-email', recoveryLimiter);
app.use('/invite', inviteLimiter);
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