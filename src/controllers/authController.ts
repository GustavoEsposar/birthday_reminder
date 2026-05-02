import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Pessoa from '../models/Pessoa';
import { AuthRequest } from '../types/AuthRequest';
import { TokenType } from '../models/Token';
import { tokenService } from '../services/TokenService';
import { emailService } from '../services/EmailService';
import { sanitizeString, isValidLength } from '../utils/sanitizer';

export class AuthController {
    async getLogin(req: Request, res: Response) {
        res.render('login', { title: 'Login', extraScripts: ['/js/toast.js', '/js/login.js', '/js/password-toggle.js'] });
    }

    async login(req: Request, res: Response) {
        let { email, password } = req.body;
        email = email ? email.trim() : "";
        password = sanitizeString(password);

        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        if (!isValidLength(password, 8, 64)) {
            return res.status(400).json({ error: 'A senha deve ter entre 8 e 64 caracteres.' });
        }

        try {
            const user = await Pessoa.findOne({ email });

            if (user && await user.matchPassword(password)) {
                // Conta existe e senha está correta, mas email ainda não foi verificado
                if (user.isVerified === false) {
                    // Gera e reenvia o token de verificação para o email
                    const token = await tokenService.generateToken(user._id, TokenType.EMAIL_VERIFICATION);
                    await emailService.enviarToken(user, token, TokenType.EMAIL_VERIFICATION);

                    return res.status(403).json({
                        requiresVerification: true,
                        message: 'Sua conta ainda não foi verificada. Enviamos um novo código para o seu email.'
                    });
                }

                req.session.userId = String(user._id);
                return res.status(200).json({ redirect: '/app' });
            }

            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

        } catch (error) {
            return res.status(500).json({ error: 'Erro interno ao fazer login. Tente novamente.' });
        }
    }

    async getForgotPasswordView(req: Request, res: Response) {
        res.render('login-recovery', { title: 'Recuperar Senha', extraScripts: ['/js/toast.js', '/js/recovery.js', '/js/password-toggle.js'] });
    }

    async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;

        try {
            const user = await Pessoa.findOne({ email });

            if (user) {
                const token = await tokenService.generateToken(user._id, TokenType.PASSWORD_RECOVERY);
                await emailService.enviarToken(user, token, TokenType.PASSWORD_RECOVERY);

                return res.status(200).json({ message: 'Verifique seu email para informar o token de recuperação.' });
            } else {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
        } catch (error) {
            return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
        }
    }

    async resetPassword(req: Request, res: Response) {
        let { email, token, password, passwordConfirm } = req.body;
        
        email = email ? email.trim() : "";
        password = sanitizeString(password);
        passwordConfirm = sanitizeString(passwordConfirm);

        try {
            if (!email || !token || !password || !passwordConfirm) {
                return res.status(400).json({ error: "Todos os campos são obrigatórios." });
            }

            if (!isValidLength(password, 8, 64)) {
                return res.status(400).json({ error: "A senha deve ter entre 8 e 64 caracteres." });
            }

            if (password !== passwordConfirm) {
                return res.status(400).json({ error: "As senhas não coincidem." });
            }

            const user = await Pessoa.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            const isValidToken = await tokenService.validateToken(user._id, token, TokenType.PASSWORD_RECOVERY);
            
            if (!isValidToken) {
                return res.status(400).json({ error: "Código de recuperação inválido ou expirado." });
            }

            user.password = password;
            await user.save(); // O middleware de hash em Pessoa atuará aqui

            await tokenService.deleteToken(user._id, TokenType.PASSWORD_RECOVERY);

            return res.status(200).json({ message: "Senha redefinida com sucesso. Faça login novamente." });
        } catch (error) {
            console.error("Erro ao redefinir a senha:", error);
            return res.status(500).json({ error: 'Erro interno ao processar a recuperação da senha.' });
        }
    }

    async getRegister(req: Request, res: Response) {
        res.render('register', { title: 'Cadastrar', extraScripts: ['/js/toast.js', '/js/register.js', '/js/password-toggle.js'] });
    }

    async register(req: Request, res: Response) {
        let { name, email, passwordOne, passwordTwo, birth } = req.body;
        
        name = sanitizeString(name);
        email = email ? email.trim() : "";
        passwordOne = sanitizeString(passwordOne);
        passwordTwo = sanitizeString(passwordTwo);

        try {
            if (!name || !email || !passwordOne || !passwordTwo || !birth) {
                return res.status(400).json({ error: "Todos os campos são obrigatórios." });
            }

            if (!isValidLength(name, 1, 100)) {
                return res.status(400).json({ error: "O nome deve ter no máximo 100 caracteres." });
            }

            if (!isValidLength(passwordOne, 8, 64)) {
                return res.status(400).json({ error: "A senha deve ter entre 8 e 64 caracteres." });
            }

            if (passwordOne !== passwordTwo) {
                return res.status(400).json({ error: "As senhas não coincidem." });
            }

            // TTL de 7 dias para contas não verificadas; zerado ao verificar
            const verificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const newUser = new Pessoa({
                name,
                email,
                password: passwordOne,
                birth,
                cron: ['0', '1', '2', '7'],
                birthdates: [],
                isVerified: false,
                verificationExpiry
            });

            await newUser.save();

            // Gera e envia o token de verificação de email
            const token = await tokenService.generateToken(newUser._id, TokenType.EMAIL_VERIFICATION);
            await emailService.enviarToken(newUser, token, TokenType.EMAIL_VERIFICATION);

            return res.status(201).json({ message: 'Conta criada! Verifique seu email para ativar.' });

        } catch (error: any) {
            // Trata erro de e-mail duplicado (MongoDB E11000)
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(400).json({ error: error.message });
        }
    }

    async verifyEmail(req: Request, res: Response) {
        const { email, token } = req.body;

        try {
            const user = await Pessoa.findOne({ email, isVerified: false });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado ou email já verificado.' });
            }

            const isValid = await tokenService.validateToken(user._id, token, TokenType.EMAIL_VERIFICATION);

            if (!isValid) {
                return res.status(400).json({ error: 'Código inválido ou expirado.' });
            }

            // Ativa a conta e remove o TTL condicional
            user.isVerified = true;
            user.verificationExpiry = null;
            await user.save();

            await tokenService.deleteToken(user._id, TokenType.EMAIL_VERIFICATION);

            return res.status(200).json({ redirect: '/login' });

        } catch (error) {
            console.error("Erro ao verificar email:", error);
            return res.status(500).json({ error: 'Erro interno ao verificar o email.' });
        }
    }

    isAuthenticated(req: Request, res: Response, next: NextFunction) {
        if (req.session.userId) return next();
        return res.redirect('/login');
    }

    authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Acesso negado' });
        }

        jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
            if (err || !decoded) {
                return res.status(403).json({ message: 'Token inválido' });
            }

            const payload = decoded as { userId: string };

            req.user = {
                userId: payload.userId
            };

            next();
        });
    }
}    

export const authController = new AuthController();