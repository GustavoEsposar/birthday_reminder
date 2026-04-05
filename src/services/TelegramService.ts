import { telegramBot } from "./TelegramBot";
import type { INotificationProvider, UsuarioComAniversarios } from "../types/NotificationTypes";

export class TelegramService implements INotificationProvider {
    
    public async send(usuarios: UsuarioComAniversarios[]): Promise<void> {
        // 1. Filtra apenas os usuários que possuem um chatId vinculado no banco
        const usuariosValidos = usuarios.filter(u => u.user.chatId);

        if (usuariosValidos.length === 0) {
            return;
        }

        // 2. Itera sobre cada usuário para formatar e enviar a mensagem
        for (const { user, aniversarios } of usuariosValidos) {
            let mensagem = `🎂 Olá, **${user.name}**! Aqui estão os lembretes de hoje:\n\n`;

            for (const { intervalo, aniversarios: listaDoDia } of aniversarios) {
                
                if (intervalo === 0) {
                    mensagem += `🔔 **HOJE** (${listaDoDia.length} aniversariante(s)):\n`;
                } else {
                    mensagem += `⏳ Em **${intervalo}** dia(s) (${listaDoDia.length} aniversariante(s)):\n`;
                }

                listaDoDia.forEach(a => {
                    const d = new Date(a.date);
                    const dia = String(d.getUTCDate()).padStart(2, "0");
                    const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
                    mensagem += `  - ${a.name} (${dia}/${mes})\n`;
                });

                mensagem += `\n`; // Quebra de linha entre intervalos
            }

            // 3. Usa o motor do bot para despachar a mensagem formatada
            await telegramBot.sendMessage(user.chatId as string, mensagem);
        }
    }
}

// Exportamos a instância do Serviço para ser injetada no NotificationJob
export const telegramService = new TelegramService();