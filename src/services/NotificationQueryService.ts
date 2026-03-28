import Pessoa from "../models/Pessoa";
import type { IPessoa } from "../models/Pessoa";
import type { UsuarioComAniversarios, AniversariosPorDiaList } from "../types/NotificationTypes";

const BATCH_SIZE = 100;

// Domain Service (Serviço de Domínio) ou Use Case (Caso de Uso). 
// A responsabilidade dele é estritamente comportamental: ir ao banco de dados,
// aplicar uma regra de negócio (filtrar datas) e devolver um resultado.

export const buscarUsuariosComAniversarios = async (): Promise<UsuarioComAniversarios[]> => {
    const hoje = new Date();
    const resultados: UsuarioComAniversarios[] = [];

    // Stream do Mongo — NÃO carrega tudo em RAM
    const cursor = Pessoa.find({})
        .lean()
        .batchSize(BATCH_SIZE)
        .cursor();

    for (
        let user = (await cursor.next()) as IPessoa | null;
        user !== null;
        user = (await cursor.next()) as IPessoa | null
    ) {
        if (!user.birthdates || user.birthdates.length === 0) continue;

        const aniversariosPorDia: AniversariosPorDiaList[] = []

        for (let intervalo of user.cron.map(d => parseInt(d))) {
            const alvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            alvo.setDate(alvo.getDate() + intervalo);

            const targetMonth = alvo.getUTCMonth() + 1;
            const targetDay = alvo.getUTCDate();

            // Filtra apenas os aniversários do intervalo desejado
            const aniversariosFiltrados = user.birthdates.filter((b) => {
                const data = new Date(b.date);

                return (
                    data.getUTCMonth() + 1 === targetMonth &&
                    data.getUTCDate() === targetDay
                );
            });

            // se nao houver aniversarios nesse intervalo, pula pro próximo intervalo
            if (aniversariosFiltrados.length === 0) continue;

            aniversariosPorDia.push({
                intervalo: intervalo,
                aniversarios: aniversariosFiltrados.map(b => ({
                    name: b.name,
                    date: b.date
                }))
            });
        }

        if (aniversariosPorDia.length > 0) {
            resultados.push({
                user,
                aniversarios: aniversariosPorDia
            });
        }
    }

    return resultados;
};