const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const timezone = 'America/Sao_Paulo'; 
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Pessoa = require('./models/Pessoa'); //como desacoplar esta logica?

const { enviarLembretePorEmail } = require('./services/emailService');

const app = express();

// template engine
app.set('view engine', 'ejs')

// pulbic files
app.use(express.static(path.join(__dirname, 'public')));

// enable receiving POST
app.use(express.urlencoded( {extended: true} ))

// Configurar sessões
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
    }
}));

const PORT = process.env.PORT || 3000;

const rotinaDeNotificacao = async () => {
    enviarLembretePorEmail(0, " - HOJE");
    enviarLembretePorEmail(2, " - Em 2 dias");
    enviarLembretePorEmail(7, " - Em 7 dias");
}

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}


const MONGOOSE_OPTIONS = { };
mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTIONS)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso');
        //rotinaDeNotificacao();  //apenas para verificar o deploy da aplicação
    })
    .catch((error) => {
        console.log('Erro ao conectar ao MongoDB:', error);
    });

/*          Rotas
=============================================================================================
*/
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Birthday Reminder - Home'
    })
});

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Birthday Reminder - Login'
    })
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await Pessoa.findOne({ email });
        
        if (user && await user.matchPassword(password)) {
            req.session.userId = user._id; // Iniciar sessão
            res.redirect('/dashboard');
        } else {
            res.status(400).send('Credenciais inválidas');
        }
    } catch (error) {
        res.status(500).send('Erro ao fazer login');
    }
});

app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Birthday Reminder - Cadastrar'
    })
});

app.post('/register', async (req, res) => {
    const { name, email, passwordOne, passwordTwo } = req.body;

    try {
        if(passwordOne != passwordTwo) throw new Error("As senhas não são iguais!");
        const password = passwordOne;
        const user = new Pessoa({ name, email, password });
        
        await user.save();
        req.session.userId = user._id;
        res.redirect('/login');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.get('/dashboard', isAuthenticated, async (req, res) => {
    const user = await Pessoa.findById(req.session.userId);
    res.render('dashboard', {
        title: 'Birthday Reminder - Dashboard',
        user: user
    });
});

app.post('/add-birthdate', isAuthenticated, async (req, res) => {
    const user = await Pessoa.findById(req.session.userId);
    res.render('dashboard', {
        title: 'Birthday Reminder - Dashboard',
        user: user
    });
});

app.post('/delete-birthdate', async (req, res) => {
    try {
        const { birthdateId, userId } = req.body;
        
        await Pessoa.updateOne(
            { _id: userId },
            { $pull: { birthdates: { _id: birthdateId } } }
        );
        res.redirect('/dashboard'); // Redireciona após a exclusão
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao deletar aniversário');
    }
});


//update-birthdate

/*          
=============================================================================================
*/

cron.schedule('0 5 * * *', async () => {
    await rotinaDeNotificacao();
}, {
    timezone: timezone
});

app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});
