const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');
const connectDB = require('./src/db/db');
const { enviarLembretePorEmail } = require('./services/emailService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const timezone = 'America/Sao_Paulo';

// connectando ao mongodb
connectDB();

// Configurando Template engine
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Configurando sessões
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

/*          Rotas
=============================================================================================
*/
const homeRoute = require('./src/routes/homeRoute');
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const mobileRoutes = require('./src/routes/mobileRoutes');
app.use(homeRoute);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(mobileRoutes);
/*          
=============================================================================================
*/

// Notificações agendadas
cron.schedule('0 5 * * *', async () => {
    const envios = [
        { dias: 0, frase: " - HOJE" },
        { dias: 1, frase: " - Em 1 dia" },
        { dias: 2, frase: " - Em 2 dias" },
        { dias: 7, frase: " - Em 7 dias" }
    ];

    for (const envio of envios) {
        await enviarLembretePorEmail(envio.dias, envio.frase);
    }
}, { timezone });

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
