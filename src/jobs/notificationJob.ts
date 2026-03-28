import { buscarUsuariosComAniversarios } from "../services/NotificationQueryService";
import { emailService } from "../services/EmailService";
// import { telegramBotService } from "../services/telegramBotService"; 

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
        await emailService.send(listaUsuarios);
        //await telegramBotService.send(listaUsuarios);
        
        console.log("[CRON] Rotina de notificações finalizada com sucesso.");
    } catch (error) {
        console.error("[CRON] Erro crítico na rotina de notificações:", error);
    }
};