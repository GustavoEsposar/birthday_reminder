# ADR-001: Token de rota pública com mínimo de 16 caracteres hexadecimais

**Status:** Aceito  
**Data:** 2026-05-10  
**Contexto:** Implementação do Magic Link — geração de token para rota pública `/invite/:token`

---

## Problema

Rotas públicas (sem autenticação) expostas à internet precisam de tokens resistentes a força bruta. O `TokenService` existente gera tokens de 6 caracteres — insuficiente para superfície de ataque pública.

## Decisão

Qualquer token exposto em rota pública deve ter **no mínimo 16 caracteres hexadecimais**, gerados via `crypto.randomBytes(8).toString('hex')`, resultando em 2⁶⁴ possibilidades.

Tokens de uso interno (fluxos autenticados, confirmação de email em sessão protegida) podem seguir o padrão do `TokenService` existente (6 chars) — o contexto de autenticação prévia reduz o risco.

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| Reutilizar `TokenService` (6 chars) | TTL variável não suportado; entropia insuficiente para rota pública |
| UUID v4 | Mais longo que necessário; formato menos amigável para URL |
| Token assinado (JWT) | Overhead desnecessário para um token de uso único com TTL gerenciado por TTL index do MongoDB |

## Consequências

- ✅ 2⁶⁴ possibilidades tornam força bruta inviável mesmo sem rate limiting
- ✅ Rate limiting por IP no endpoint de submit é uma segunda camada, não a única defesa
- ⚠️ Features futuras com rotas públicas devem observar este padrão — não reutilizar o `TokenService` para esse caso
