import { telegramBot } from "./TelegramBot";
import type {
    INotificationProvider,
    UsuarioComAniversarios,
} from "../types/NotificationTypes";
import { parse } from "path";

export class TelegramService implements INotificationProvider {
    public async send(usuarios: UsuarioComAniversarios[]): Promise<void> {
        // 1. Filtra apenas os usuários que possuem um chatId vinculado no banco
        const usuariosValidos = usuarios.filter((u) => u.user.chatId);

        if (usuariosValidos.length === 0) {
            return;
        }

        // 2. Itera sobre cada usuário para formatar e enviar a mensagem
        for (const { user, aniversarios } of usuariosValidos) {
            const nomeRaw = user.name.trim().split(" ")?.[0] || "Amigo(a)";
            const nome = escapeMarkdown(nomeRaw);
            const d = new Date();

            // Note o uso de * para negrito e o escape nas pontuações
            let mensagem =
                `🎂 *${nome}*, seu lembrete de aniversários chegou\!\n\n`;

            for (
                const { intervalo, aniversarios: listaDoDia } of aniversarios
            ) {
                if (intervalo === 0) {
                    mensagem +=
                        `🔔 \[HOJE\] Há ${listaDoDia.length} aniversariante(s):\n`;
                } else {
                    const dataFutura = new Date(
                        d.getTime() + intervalo * 24 * 60 * 60 * 1000,
                    );
                    const dia = String(dataFutura.getUTCDate()).padStart(
                        2,
                        "0",
                    );
                    const mes = String(dataFutura.getUTCMonth() + 1).padStart(
                        2,
                        "0",
                    );
                    const dataFormatada = `${dia}/${mes}`;

                    // Escapamos a data e o intervalo, e usamos * para negrito
                    mensagem += `⏳ \[${
                        escapeMarkdown(dataFormatada)
                    }\] Em *${intervalo}* dia(s) terá ${listaDoDia.length} aniversariante(s):\n`;
                }

                listaDoDia.forEach((a) => {
                    // Escapamos o nome do aniversariante e o hífen
                    mensagem += `  \- ${escapeMarkdown(a.name)}\n`;
                });

                mensagem += `\n`;
            }

            await telegramBot.sendMessage(user.chatId as string, mensagem, {
                parse_mode: "Markdownv2",
            });
        }
    }
}

// Função auxiliar para escapar caracteres especiais do MarkdownV2
const escapeMarkdown = (text) => {
    return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
};

// Exportamos a instância do Serviço para ser injetada no NotificationJob
export const telegramService = new TelegramService();
