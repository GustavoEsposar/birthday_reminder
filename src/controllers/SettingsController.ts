import Pessoa from '../models/Pessoa';
import type { Request, Response } from 'express';

export class SettingsController {
    public async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const user = await Pessoa.findById(req.session.userId);
            res.render('dashboard-settings', {
                title: 'Birthday Reminder - Configurações',
                user: user,
                extraScripts: ['/js/navbar-dashboard.js', '/js/settings.js']
            });
        } catch (error) {
            res.status(500).send('Erro ao carregar as configurações');
        }
    }

    async updateNotificationSchedule(req: Request, res: Response) {
        try {
            const { cronValues } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                res.status(401).json({ error: "Não autorizado." });
                return;
            }

            const usuario = await Pessoa.findById(userId);
            if (!usuario) {
                res.status(404).json({ error: "Usuário não encontrado." });
                return;
            }

            usuario.cron = cronValues;
            await usuario.save();

            res.json({ message: 'Programação de notificações atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar a programação de notificações' });
        }
    }

    async updateNotificationReceiver(req: Request, res: Response) {}

    async updateAccountPassword(req: Request, res: Response) {}

    async deleteAccount(req: Request, res: Response) {}
}

export const settingsController = new SettingsController();