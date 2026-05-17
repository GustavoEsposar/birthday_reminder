import { buscarUsuariosComAniversarios, buscarUsuariosComAniversariosEmLotes } from "../services/NotificationQueryService";
import { emailService } from "../services/EmailService";
import { telegramService } from "../services/TelegramService";
import { NotificationChannel } from "../models/Pessoa";
import { logger } from "../utils/logger";

export const executarEnvioDiarioEmLotes = async (): Promise<void> => {
    try {
        console.log("[CRON] Iniciando rotina em lotes...");

        // Consome os dados aos poucos usando "for await"
        for await (const loteUsuarios of buscarUsuariosComAniversariosEmLotes()) {
            
            console.log(`[CRON] Processando e enviando um lote de ${loteUsuarios.length} usuários...`);

            // Dispara para esse lote. O EmailService recebe apenas um lote por vez.
            await emailService.send(loteUsuarios.filter(u => u.user.notificationChannels.includes(NotificationChannel.EMAIL)));
            await telegramService.send(loteUsuarios.filter(u => u.user.notificationChannels.includes(NotificationChannel.TELEGRAM)));
        }

        console.log("[CRON] Rotina de notificações finalizada com sucesso.");
    } catch (error) {
        logger.error('[CRON] Erro crítico na rotina de notificações:', error);
    }
};

export const executarEnvioDiario = async (): Promise<void> => {
    try {
        console.log("[CRON] Iniciando rotina diária de notificações...");

        // Busca todos os dados já agrupados e mastigados
        const listaUsuarios = await buscarUsuariosComAniversarios();

        if (listaUsuarios.length === 0) {
            console.log("[CRON] Nenhuma notificação para enviar hoje.");
            return;
        }

        console.log(`[CRON] Processando notificações para ${listaUsuarios.length} usuário(s).`);

        // Dispara as mensagens repassando a lista para os provedores
        await emailService.send(listaUsuarios.filter(u => u.user.notificationChannels.includes(NotificationChannel.EMAIL)));
        //await telegramBotService.send(listaUsuarios);
        
        console.log("[CRON] Rotina de notificações finalizada com sucesso.");
    } catch (error) {
        logger.error('[CRON] Erro crítico na rotina de notificações:', error);
    }
};