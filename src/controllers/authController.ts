import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Pessoa from '../models/Pessoa';
import { AuthRequest } from '../types/AuthRequest';
import { TokenType } from '../models/Token';
import { tokenService } from '../services/TokenService';
import { emailService } from '../services/EmailService';

export class AuthController {
    async getLogin(req: Request, res: Response) {
        res.render('login', { title: 'Login', extraScripts: ['/js/toast.js', '/js/login.js'] });
    }

    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await Pessoa.findOne({ email });

            if (user && await user.matchPassword(password)) {
                req.session.userId = String(user._id);
                return res.status(200).json({ redirect: '/app' });
            }

            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

        } catch (error) {
            return res.status(500).json({ error: 'Erro interno ao fazer login. Tente novamente.' });
        }
    }

    async getForgotPasswordView(req: Request, res: Response) {
        res.render('login-recovery', { title: 'Recuperar Senha', extraScripts: ['/js/toast.js', '/js/recovery.js'] });
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
        const { email, token, password, passwordConfirm } = req.body;

        try {
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
        res.render('register', { title: 'Cadastrar', extraScripts: ['/js/toast.js', '/js/register.js'] });
    }

    async register(req: Request, res: Response) {
        const { name, email, passwordOne, passwordTwo, birth } = req.body;

        try {
            if (passwordOne !== passwordTwo) {
                throw new Error("As senhas não são iguais!");
            }

            const newUser = new Pessoa({
                name,
                email,
                password: passwordOne,
                birth,
                cron: ['0', '1', '2', '7'],
                birthdates: []
            });

            await newUser.save();

            return res.status(201).json({ redirect: '/login' });

        } catch (error: any) {
            // Trata erro de e-mail duplicado (MongoDB E11000)
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(400).json({ error: error.message });
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