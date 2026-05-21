# Birthday Reminder — Sumário de Documentação

> Índice central do projeto. Responsabilidade única: navegação e rastreamento de status.  
> Para decisões arquiteturais globais, consulte `docs/decisions/`.  
> Para contexto de implementação de features, consulte `docs/plans/`.

---

## Dashboard de Implementações

| Funcionalidade | Plano | PR | Status | Data |
|---|---|---|---|---|
| Personalização de canais de notificação | — | #5 | ✅ | 2026-04-30 |
| Preferências de intervalos de lembrete | — | #5 | ✅ | 2026-04-30 |
| Remoção e desvinculação do Telegram | — | #5 | ✅ | 2026-04-30 |
| Token Service reutilizável | — | #6 | ✅ | 2026-04-30 |
| Deleção de conta | — | #6 | ✅ | 2026-04-30 |
| Recuperação de senha (sem login) | — | #8 | ✅ | 2026-04-30 |
| Verificação de conta ativa no login/cadastro | — | #10 | ✅ | 2026-05-02 |
| Magic Link — backend | [magic-link.md](./plans/magic-link.md) | #12 | ✅ | 2026-05-10 |
| Magic Link — UI | [magic-link-ui.md](./plans/magic-link-ui.md) | #12 | ✅ | 2026-05-10 |
| Security Hardening (OWASP Top 10) | [security-hardening.md](./plans/security-hardening.md) | — | ✅ | 2026-05-15 |
| Alterar E-mail (two-step token) | [account-settings-2fa.md](./plans/account-settings-2fa.md) | — | ✅ | 2026-05-20 |
| Alterar Senha (two-step token) | [account-settings-2fa.md](./plans/account-settings-2fa.md) | — | ✅ | 2026-05-20 |
| Padronização de UI dos cards de configuração | — | — | ✅ | 2026-05-20 |

---

## Planos de Feature

| Arquivo | Funcionalidade | Status |
|---|---|---|
| [magic-link.md](./plans/magic-link.md) | Magic Link — modelos, endpoints, fluxo | ✅ Implementado |
| [magic-link-ui.md](./plans/magic-link-ui.md) | Magic Link — dashboard, settings, páginas públicas | ✅ Implementado |
| [security-hardening.md](./plans/security-hardening.md) | Security hardening — 8 findings OWASP remediados | ✅ Implementado |
| [account-settings-2fa.md](./plans/account-settings-2fa.md) | Alterar E-mail e Alterar Senha com confirmação por token em dois estágios | ✅ Implementado |

---

## Decisões Arquiteturais (ADRs)

| ADR | Decisão | Status |
|---|---|---|
| [ADR-000](./decisions/ADR-000-convencao-documentacao.md) | Convenção de documentação do projeto | Aceito |
| [ADR-001](./decisions/ADR-001-token-publico-16chars-hex.md) | Token de rota pública ≥ 16 chars hex | Aceito |
| [ADR-002](./decisions/ADR-002-colecoes-transitorias-separadas.md) | Coleções de estado transitório como documentos separados | Aceito |
| [ADR-003](./decisions/ADR-003-promise-all-ssr-queries-paralelas.md) | Promise.all para queries independentes no servidor | Aceito |
| [ADR-004](./decisions/ADR-004-logger-centralizado-producao.md) | Logger centralizado com supressão de stack traces em produção | Aceito |
| [ADR-005](./decisions/ADR-005-cors-origin-whitelist.md) | CORS restrito a origens explícitas via variável de ambiente | Aceito |

---

## Roadmap — Backlog

| Funcionalidade | Origem | Prioridade |
|---|---|---|
| Campos customizáveis no formulário de invite | [magic-link.md §Fase 2](./plans/magic-link.md#fases-de-implementação) | Baixa |
| Histórico de entradas aprovadas com origem "via link" | [magic-link.md §Fase 2](./plans/magic-link.md#fases-de-implementação) | Baixa |
| Contador de submissões por link | [magic-link.md §Fase 2](./plans/magic-link.md#fases-de-implementação) | Baixa |

---

## Convenção

Consulte [ADR-000](./decisions/ADR-000-convencao-documentacao.md) para critérios de quando criar um plano ou ADR.
