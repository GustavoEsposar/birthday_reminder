import Pessoa from '../models/Pessoa';
import type { Request, Response } from 'express';

export class SettingsController {
    public async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const user = await Pessoa.findById(req.session.userId);
            res.render('dashboard-settings', {
                title: 'Birthday Reminder - Configurações',
                user: user
            });
        } catch (error) {
            res.status(500).send('Erro ao carregar as configurações');
        }
    }

    async updateNotificationSchedule(req: Request, res: Response) {}

    async updateNotificationReceiver(req: Request, res: Response) {}

    async updateAccountPassword(req: Request, res: Response) {}
}

export const settingsController = new SettingsController();