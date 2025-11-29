import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Pessoa from '../models/Pessoa';

export class AuthController {
    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await Pessoa.findOne({ email });

            if (user && await user.matchPassword(password)) {
                req.session.userId = String(user._id);
                return res.redirect('/dashboard');
            }

            return res.status(400).send('Credenciais inválidas');

        } catch (error) {
            return res.status(500).send('Erro ao fazer login');
        }
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
                birth
            });

            await newUser.save();
            req.session.userId = String(newUser._id);

            return res.redirect('/login');

        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    isAuthenticated(req: Request, res: Response, next: NextFunction) {
        if (req.session.userId) return next();
        return res.redirect('/login');
    }

    authenticateToken(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Acesso negado' });
        }

        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token inválido' });
            }

            (req as any).user = user;
            next();
        });
    }
}    

export const authController = new AuthController();