# ADR-003: Promise.all para queries independentes no servidor (SSR)

**Status:** Aceito  
**Data:** 2026-05-10  
**Contexto:** Implementação do Magic Link — carregamento de dados do dashboard com `Pessoa` + `PendingBirthdate`

---

## Problema

Quando uma rota SSR precisa de dados de duas ou mais fontes independentes, a ordem de execução das queries afeta diretamente o TTFB (Time to First Byte). Queries em sequência somam os tempos; queries em paralelo pagam apenas o tempo da mais lenta.

## Decisão

Queries de banco de dados **independentes entre si** dentro de um mesmo handler de rota devem ser executadas com `Promise.all`, nunca em sequência com `await` encadeado.

```typescript
// Padrão adotado
const [user, pendingEntries] = await Promise.all([
    Pessoa.findById(req.session.userId),
    PendingBirthdate.find({ ownerId: req.session.userId })
]);
```

"Independentes" significa: o resultado de uma query não é input da outra.

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| `await` sequencial | TTFB = soma dos tempos das queries; sem benefício sobre paralelo |
| Fetch client-side (lazy load) | Introduz layout shift; aumenta complexidade de JS; requer estado de loading |
| Cache em memória entre requests | Prematura para o volume atual; adiciona invalidação como problema novo |

## Consequências

- ✅ TTFB = `max(query1, query2, ...)` em vez de `sum()`
- ✅ Zero layout shift — dados chegam completos antes do render
- ✅ Sem complexidade adicional de JS no cliente
- ⚠️ Se as queries crescerem em número, avaliar se alguma pode ser lazy — `Promise.all` com 10 queries paralelas pode saturar o pool de conexões
