# ADR-000: Convenção de Documentação do Projeto

**Status:** Aceito  
**Data:** 2026-05-11  
**Contexto:** Projeto pessoal com potencial de crescer para colaboração; necessidade de preservar o *porquê* de decisões técnicas sem depender de memória

---

## Problema

Sem uma convenção estabelecida, decisões técnicas ficam dispersas em commits, PRs e conversas — tornando difícil entender *por que* algo foi feito de determinada forma semanas ou meses depois.

## Decisão

Adotar um framework de documentação em dois níveis:

**Nível 1 — Planos de feature** (`docs/plans/`)  
Para features que atendam ao critério abaixo. Documenta *o que* e *como* uma feature específica foi construída.

**Nível 2 — ADRs** (`docs/decisions/`)  
Para decisões que estabelecem padrões ou restrições aplicáveis a qualquer feature futura. Documenta o *porquê* de forma consultável globalmente.

**Hub central** (`docs/SUMMARY.md`)  
Dashboard de implementações, índice de planos e ADRs. Responsabilidade única: navegação e rastreamento de status.

**Gate de atualização** (`.github/PULL_REQUEST_TEMPLATE.md`)  
Checklist no PR que força decisão consciente sobre documentar ou não.

---

## Critério para plano obrigatório

Uma feature exige `docs/plans/plan-<feature>.md` quando envolve **combinação** de:

- Nova regra de negócio com impacto no modelo de dados
- Refatoração arquitetural ou considerações de segurança
- Esforço de tempo considerável

Mudanças pontuais (bug fixes, ajustes de texto, refactors isolados) **não** exigem plano.

---

## Critério para ADR

Uma decisão vai para `docs/decisions/ADR-NNN-<descricao>.md` quando:

- Estabelece um padrão que **qualquer feature futura** deve respeitar, **ou**
- Define uma restrição de segurança, modelagem ou arquitetura global

---

## Convenções de arquivo

| Tipo | Local | Nomenclatura |
|---|---|---|
| Plano de feature | `docs/plans/` | `<feature>.md` ou `<feature>-ui.md` |
| ADR | `docs/decisions/` | `ADR-NNN-<descricao-kebab>.md` |
| Hub | `docs/` | `SUMMARY.md` |

- ADRs são numerados sequencialmente a partir de `ADR-001` (este é `ADR-000` por ser a meta-convenção)
- Números nunca são reutilizados — ADRs substituídos recebem status `Substituído por ADR-NNN`
- ADRs **nunca são deletados** — o histórico de decisões abandonadas é tão valioso quanto as aceitas

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| Tudo em `SUMMARY.md` | Arquivo único cresce sem controle; decisões globais ficam misturadas com contexto de feature |
| Só `docs/plans/` sem ADRs | Decisões arquiteturais ficam enterradas em planos específicos, sem forma de consultá-las transversalmente |
| Wiki do GitHub | Desacoplado do código; sem versionamento junto ao repo |

## Consequências

- ✅ Decisões globais consultáveis sem saber em qual feature foram tomadas
- ✅ Manutenção forçada pelo PR template — não depende de memória
- ✅ Padrão reconhecível por colaboradores externos
- ⚠️ Requer disciplina para distinguir "decisão de feature" de "decisão arquitetural" — o critério acima é o guia
