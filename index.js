const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');
const connectDB = require('./db/db');
const { enviarLembretePorEmail } = require('./services/emailService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const timezone = 'America/Sao_Paulo';

// Conectar ao banco de dados
connectDB();

// Template engine e arquivos estáticos
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Configurar sessões
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Importar rotas
const homeRoute = require('./routes/homeRoute');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use(homeRoute);
app.use(authRoutes);
app.use(dashboardRoutes);

// Notificações agendadas
cron.schedule('0 5 * * *', async () => {
    await rotinaDeNotificacao();
}, { timezone });

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
