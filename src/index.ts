
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import cron from "node-cron";

import connectDB from "./db/db";
import { enviarLembretePorEmail } from "./services/emailService";


const app = express();
const PORT = process.env.PORT || 3003;
const timezone = "America/Sao_Paulo";

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
import homeRoute from "./routes/homeRoute";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import mobileRoutes from "./routes/mobileRoutes";

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
        await enviarLembretePorEmail();
    },
    { timezone }
);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));