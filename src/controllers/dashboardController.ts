import Pessoa from '../models/Pessoa';
import type { Request, Response, NextFunction } from 'express';

export class DashboardController {
    async getDashboard(req : Request, res: Response) {
        try {
            const user = await Pessoa.findById(req.session.userId);
            res.render('dashboard', {
                title: 'Birthday Reminder - Dashboard',
                user: user
            });
        } catch (error) {
            res.status(500).send('Erro ao carregar o dashboard');
        }
    }

    async addBirthdate(req: Request, res: Response) {
        try {
            const { name, birthdate } = req.body;
            await Pessoa.updateOne(
                { _id: req.session.userId },
                { $push: { birthdates: { name, date: birthdate } } }
            );
            res.redirect('/dashboard');
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao adicionar aniversário');
        }
    }

    async deleteBirthdate(req: Request, res: Response) {
        try {
            const { birthdateId } = req.body;
            await Pessoa.updateOne(
                { _id: req.session.userId },
                { $pull: { birthdates: { _id: birthdateId } } }
            );
            res.redirect('/dashboard');
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao deletar aniversário');
        }
    }
}

export const dashboardController = new DashboardController();