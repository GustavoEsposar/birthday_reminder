import sanitizeHtml from 'xss';
import mongoSanitize from 'mongo-sanitize';
/**
 * Limpa uma string removendo espaços extras nas extremidades e substituindo
 * múltiplos espaços internos por apenas um.
 */
export const sanitizeString = (str: string): string => {
    if (!str) return "";
    const clean = str.trim().replace(/\s+/g, ' ');
    return sanitizeHtml(clean);
};

export const sanitizeBody = <T>(body: T): T => {
    return mongoSanitize(body);                  // remove operadores Mongo
};

/**
 * Valida o tamanho de uma string.
 */
export const isValidLength = (str: string, min: number, max: number): boolean => {
    return str.length >= min && str.length <= max;
};
