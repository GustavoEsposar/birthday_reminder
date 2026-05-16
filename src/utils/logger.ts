const isProd = process.env.NODE_ENV === 'production';

export const logger = {
    /**
     * Loga erros sem expor stack traces em produção.
     * Em desenvolvimento: exibe o objeto completo.
     * Em produção: exibe apenas a mensagem da Error, ou 'unknown error'.
     */
    error: (msg: string, err?: unknown): void => {
        if (isProd) {
            const safeDetail = err instanceof Error ? err.message : 'unknown error';
            console.error(`[ERROR] ${msg} — ${safeDetail}`);
        } else {
            console.error(`[ERROR] ${msg}`, err);
        }
    },

    warn: (msg: string, detail?: unknown): void => {
        if (isProd) {
            console.warn(`[WARN] ${msg}`);
        } else {
            console.warn(`[WARN] ${msg}`, detail);
        }
    },

    info: (msg: string): void => {
        console.log(`[INFO] ${msg}`);
    },
};
