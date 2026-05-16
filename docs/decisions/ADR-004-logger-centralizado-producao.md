# ADR-004: Logger centralizado com supressão de stack traces em produção

**Status:** Aceito  
**Data:** 2026-05-15  
**Contexto:** Sprint de security hardening — FINDING-08 (OWASP A09:2021 – Security Logging and Monitoring Failures)

---

## Problema

`console.error('mensagem', error)` espalhado pelos controllers loga o objeto `Error` completo em produção, expondo stack traces que revelam paths internos, versões de libs e estrutura da aplicação.

Adicionalmente, em `EmailService`, o log incluía o e-mail do usuário no argumento da mensagem — vazamento de PII.

## Decisão

Criar `src/utils/logger.ts` com um wrapper mínimo que:
- Em **desenvolvimento** (`NODE_ENV !== 'production'`): loga o objeto completo para máxima debugabilidade
- Em **produção**: loga apenas `err.message` (ou `'unknown error'` para não-`Error`) — nunca o stack

```ts
export const logger = {
    error: (msg: string, err?: unknown): void => {
        if (isProd) {
            const safeDetail = err instanceof Error ? err.message : 'unknown error';
            console.error(`[ERROR] ${msg} — ${safeDetail}`);
        } else {
            console.error(`[ERROR] ${msg}`, err);
        }
    },
    warn:  (msg: string, detail?: unknown): void => { ... },
    info:  (msg: string): void => { ... },
};
```

Todo `console.error` em controllers e serviços deve ser substituído por `logger.error`.  
Mensagens de aviso não-críticos (ex: bot Telegram sem token) usam `logger.warn`.

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| Continuar com `console.error` raw | Vaza stack traces em produção — risco de exposição de estrutura interna |
| Adotar `pino` ou `winston` imediatamente | Overhead desnecessário no estágio atual; `pino` requer configuração de transports e redação de PII; vale quando o projeto escalar |
| `try/catch` suprimindo o erro silenciosamente | Pior dos dois mundos: perde rastreabilidade e não resolve o problema em produção |

## Consequências

- ✅ Stack traces nunca aparecem em logs de produção
- ✅ PII (e-mail, chatId) não deve ser incluído como argumento de `logger.error` — a mensagem deve ser genérica
- ✅ Em desenvolvimento, nenhuma informação é perdida
- ⚠️ Features futuras devem importar `logger` de `src/utils/logger.ts` — proibido usar `console.error` diretamente em controllers/services
- ⚠️ Se o projeto adotar `pino`/`winston`, este arquivo é o único ponto de troca — a API `logger.error/warn/info` permanece estável para os consumers
