import { telegramBot } from "./TelegramBot";
import type {
    INotificationProvider,
    UsuarioComAniversarios,
} from "../types/NotificationTypes";

export class TelegramService implements INotificationProvider {
    public async send(usuarios: UsuarioComAniversarios[]): Promise<void> {
        // 1. Filtra apenas os usuários que possuem um chatId vinculado
        const usuariosValidos = usuarios.filter((u) => u.user.chatId);

        if (usuariosValidos.length === 0) {
            return;
        }

        for (const { user, aniversarios } of usuariosValidos) {
            const nome = user.name.trim().split(" ")?.[0] || "Amigo(a)";
            const d = new Date();

            // Usamos <b> para negrito. Removidos os escapes de exclamação (\!)
            let mensagem = `🎂 <b>${nome}</b>, seu lembrete de aniversários chegou!\n\n`;

            for (const { intervalo, aniversarios: listaDoDia } of aniversarios) {
                if (intervalo === 0) {
                    mensagem += `🔔 <b>[HOJE]</b> Há ${listaDoDia.length} aniversariante(s):\n`;
                } else {
                    const dataFutura = new Date(
                        d.getTime() + intervalo * 24 * 60 * 60 * 1000,
                    );
                    const dia = String(dataFutura.getUTCDate()).padStart(2, "0");
                    const mes = String(dataFutura.getUTCMonth() + 1).padStart(2, "0");
                    const dataFormatada = `${dia}/${mes}`;

                    // Usamos <b> no intervalo e removemos escapes de colchetes
                    mensagem += `⏳ [${dataFormatada}] Em <b>${intervalo}</b> dia(s) terá ${listaDoDia.length} aniversariante(s):\n`;
                }

                listaDoDia.forEach((a) => {
                    // Listagem simples, sem necessidade de escapar hífens
                    mensagem += `  - ${a.name}\n`;
                });

                mensagem += `\n`;
            }

            // O TERCEIRO ARGUMENTO: Define o parse_mode como 'HTML'
            await telegramBot.sendMessage(user.chatId as string, mensagem, {
                parse_mode: "HTML",
            });
        }
    }
}

export const telegramService = new TelegramService();