/**
 * Limpa uma string removendo espaços extras nas extremidades e substituindo
 * múltiplos espaços internos por apenas um.
 */
export const sanitizeString = (str: string): string => {
    if (!str) return "";
    return str.trim().replace(/\s+/g, ' ');
};

/**
 * Valida o tamanho de uma string.
 */
export const isValidLength = (str: string, min: number, max: number): boolean => {
    return str.length >= min && str.length <= max;
};
