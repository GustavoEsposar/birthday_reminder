# Plano: Security Hardening — Sprint OWASP Top 10

**Feature:** Hardening de segurança da aplicação  
**Data:** 2026-05-15  
**PR:** (branch `dev` — sem PR separado, parte do ciclo de manutenção contínua)  
**Status:** ✅ Implementado

---

## Contexto

Após a entrega do Magic Link (PR #12), foi conduzida uma auditoria formal de segurança com metodologia **OWASP Top 10 (2021) + STRIDE**. O relatório identificou 8 findings distribuídos entre Crítico, Alto, Médio e Baixo. Todos foram remediados nesta sprint.

→ Relatório completo: `brain/security_audit_report.md`

---

## Escopo da Remediação

### 🔴 CRÍTICO

#### FINDING-01 — Rate Limiting
**Arquivo:** `src/index.ts`  
**Risco:** Brute-force de senhas, flooding de e-mails de recuperação, spam no endpoint público de invite.

**O que foi feito:**
```ts
// Três políticas distintas
const authLimiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); // /login, /register
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5  }); // /login/recovery, /login/reset-password
const inviteLimiter   = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }); // /invite/:token/submit
```

---

### 🟠 ALTO

#### FINDING-02 — Cookie de sessão inseguro
**Arquivo:** `src/index.ts`  
**O que foi feito:** Adicionadas flags `httpOnly: true`, `secure: true` (em produção) e `sameSite: 'lax'` ao cookie de sessão.

#### FINDING-03 — Enumeração de usuários
**Arquivo:** `src/controllers/authController.ts`  
**O que foi feito:** `forgotPassword` agora sempre retorna HTTP 200 com mensagem genérica — não revela se o e-mail existe ou está pendente de verificação.

#### FINDING-04 — Headers de segurança ausentes
**Arquivo:** `src/index.ts`  
**O que foi feito:** Integrado `helmet` com CSP restrita (`defaultSrc: 'self'`, `scriptSrc: 'self'`, `styleSrc: 'self' 'unsafe-inline'`).

---

### 🟡 MÉDIO

#### FINDING-05 — Sanitização insuficiente (XSS + NoSQL Injection)
**Arquivos:** `src/utils/sanitizer.ts`, `src/index.ts`, `src/controllers/PublicInviteController.ts`  
**O que foi feito:**
- `sanitizeString` agora passa pelo filtro `xss` — remove tags HTML antes de persistir
- Middleware global de `mongo-sanitize` aplicado sobre `req.body` após `express.json()` — remove operadores Mongo (`$where`, `$gt`, `$ne`, etc.) de **todos** os endpoints
- `birthdate` em `PublicInviteController` agora é sanitizado, validado via regex `AAAA-MM-DD` e verificado com `isNaN()` antes do `new Date()`

#### FINDING-06 — Token de recuperação sem unicidade no banco
**Arquivo:** `src/models/Token.ts`  
**O que foi feito:** Adicionado `unique: true` ao campo `token`. `TokenService.generateToken` replicou o padrão de retry com tratamento de `E11000` já usado pelo `InviteLinkService`.

---

### 🔵 BAIXO

#### FINDING-07 — CORS aberto
**Arquivo:** `src/index.ts`  
**O que foi feito:** `cors()` substituído por whitelist controlada via variável de ambiente:
```ts
cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3003'], credentials: true })
```
Variável a configurar em `.env` de produção: `ALLOWED_ORIGINS=https://seudominio.com`

#### FINDING-08 — Logs vazando stack traces
**Arquivos:** `src/utils/logger.ts` (novo) + todos os controllers e serviços  
**O que foi feito:** Criado `logger` centralizado. Em produção exibe apenas `err.message`; em desenvolvimento exibe o objeto completo. Substituídos 24 `console.error` distribuídos em 8 arquivos. Bônus: `EmailService` parou de expor endereço de e-mail do usuário no log de erro (PII).

---

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---|---|
| `src/index.ts` | Rate limiting · Helmet · Cookie seguro · CORS restrito · Middleware mongo-sanitize |
| `src/utils/sanitizer.ts` | XSS filter + integração mongo-sanitize |
| `src/utils/logger.ts` | **Novo** — logger centralizado |
| `src/models/Token.ts` | `unique: true` no campo token |
| `src/services/TokenService.ts` | Retry com tratamento E11000 |
| `src/controllers/authController.ts` | Resposta genérica no forgotPassword · logger |
| `src/controllers/InviteController.ts` | logger |
| `src/controllers/PublicInviteController.ts` | Sanitização de birthdate · regex de validação · logger |
| `src/controllers/SettingsController.ts` | logger |
| `src/controllers/dashboardController.ts` | logger |
| `src/jobs/notificationJob.ts` | logger |
| `src/services/EmailService.ts` | logger (sem expor e-mail do usuário) |
| `src/services/TelegramBot.ts` | logger |

---

## Dependências Adicionadas

```json
"express-rate-limit": "^7.x",
"helmet": "^8.x",
"xss": "^1.x",
"mongo-sanitize": "^1.x"
```

---

## O que permanece no Radar

| Item | Observação |
|---|---|
| CORS em produção | Configurar `ALLOWED_ORIGINS` no `.env` do servidor |
| CSP inline styles | `'unsafe-inline'` em `styleSrc` deve ser removido se migrar para CSS externo |
| Logger estruturado | Avaliar adoção de `pino` ou `winston` se o projeto escalar (logs em JSON, redação de PII automática) |
