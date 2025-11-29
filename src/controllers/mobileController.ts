import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Pessoa from "../models/Pessoa";
import { AuthRequest } from "../types/AuthRequest";

export class MobileController {

    async getBirthdates(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).send("Token inválido");

            const user = await Pessoa.findById(userId);
            if (!user) return res.status(404).send("Usuário não encontrado");

            return res.json(user.birthdates);
        } catch (error) {
            return res.status(500).send("Erro ao carregar a lista de aniversariantes");
        }
    }

    async loginMobile(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            const user = await Pessoa.findOne({ email });

            if (user && await user.matchPassword(password)) {
                const token = jwt.sign(
                    { userId: user._id },
                    process.env.JWT_SECRET as string,
                    { expiresIn: "7d" }
                );

                return res.json({
                    token,
                    name: user.name,
                    birth: user.birth
                });
            }

            return res.status(400).json({ message: "Credenciais inválidas" });

        } catch (error) {
            return res.status(500).json({ message: "Erro ao fazer login" });
        }
    }

    async deleteBirthdateMobile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).send("Token inválido");

            const id = req.body._id;

            await Pessoa.updateOne(
                { _id: userId },
                { $pull: { birthdates: { _id: id } } }
            );

            return res.sendStatus(200);

        } catch (error) {
            return res.status(500).send("Erro ao deletar aniversário");
        }
    }

    async addBirthdateMobile(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).send("Token inválido");

            const { name, date } = req.body;

            await Pessoa.updateOne(
                { _id: userId },
                { $push: { birthdates: { name, date: new Date(date) } } }
            );

            return res.sendStatus(200);

        } catch (error) {
            return res.status(500).send("Erro ao adicionar aniversário");
        }
    }

    async registerMobile(req: Request, res: Response) {
        const { name, email, passwordOne, passwordTwo, birth } = req.body;

        try {
            if (passwordOne !== passwordTwo) {
                return res.status(400).send("As senhas não são iguais!");
            }

            const user = new Pessoa({
                name,
                email,
                password: passwordOne,
                birth
            });

            await user.save();

            return res.sendStatus(200);

        } catch (error: any) {
            return res.status(400).send(error.message);
        }
    }

    validateToken(req: Request, res: Response) {
        const token = req.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Acesso negado" });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET as string);
            return res.sendStatus(200);
        } catch (err) {
            return res.sendStatus(403);
        }
    }
}

export const mobileController = new MobileController();
