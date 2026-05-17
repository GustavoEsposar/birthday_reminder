# ADR-002: Coleções de estado transitório como documentos separados

**Status:** Aceito  
**Data:** 2026-05-10  
**Contexto:** Implementação do Magic Link — modelagem de `PendingBirthdate`

---

## Problema

Dados que representam estado transitório (aguardando aprovação, processamento, confirmação) podem ser modelados de duas formas: embutidos como array no documento principal do usuário, ou como coleção separada. A escolha afeta queries, crescimento do documento e independência de ciclo de vida.

## Decisão

Estados transitórios que possuem **ciclo de vida independente** do documento pai devem ser modelados como **coleção separada**, não como array embutido.

Critérios que indicam coleção separada:

1. O estado pode ser consultado, aprovado ou expirado **independentemente** do documento pai estar presente
2. O volume de entradas é **ilimitado ou imprevisível** (risco de documento crescer indefinidamente)
3. O estado tem **TTL ou lógica de expiração** própria

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| Embutir `pendingEntries[]` em `InviteLink` | Aprovação de pendentes após expiração do link ficaria impossível; arrays crescentes sem limite |
| Embutir `pendingEntries[]` em `Pessoa` | Documento do usuário cresce sem controle; queries de aprovação exigiriam `$pull` em documento central |

## Consequências

- ✅ Queries de aprovação/rejeição independem do estado do link (expirado ou não)
- ✅ Documento `Pessoa` não cresce com entradas transitórias
- ✅ TTL index ou limpeza podem ser aplicados na coleção transitória sem afetar o documento pai
- ⚠️ Requer `JOIN` via `ownerId` nas queries do dashboard — custo aceitável para o volume esperado
