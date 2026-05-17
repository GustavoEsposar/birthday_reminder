# ADR-005: CORS restrito a origens explícitas via variável de ambiente

**Status:** Aceito  
**Data:** 2026-05-15  
**Contexto:** Sprint de security hardening — FINDING-07 (OWASP A05:2021 – Security Misconfiguration)

---

## Problema

`app.use(cors())` sem argumentos permite requisições cross-origin de **qualquer domínio**. Para uma aplicação que usa sessões com cookie (`credentials: true` é implícito nas chamadas autenticadas), isso significa que qualquer site pode fazer requisições autenticadas em nome de um usuário logado.

## Decisão

Substituir `cors()` por uma whitelist explícita controlada por variável de ambiente:

```ts
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3003'],
    credentials: true,
}));
```

**Padrão para `.env` de produção:**
```
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

**Padrão de desenvolvimento (fallback):** `http://localhost:3003`

### Regra derivada

- Qualquer domínio de produção adicionado à aplicação deve ser incluído em `ALLOWED_ORIGINS` — nunca reverter para `cors()` sem argumentos
- Subdomínios devem ser listados explicitamente (não usar wildcards como `*.dominio.com`, pois o pacote `cors` não suporta nativamente)

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| `cors()` sem argumentos | Permite qualquer origem — inaceitável com sessões autenticadas |
| Whitelist hardcoded no código | Origem de prod varia por ambiente; requer mudança de código para alterar — `.env` é mais adequado |
| Desabilitar CORS completamente | Quebra integrações futuras com SPAs ou clientes móveis |

## Consequências

- ✅ Apenas origens conhecidas podem fazer requisições cross-origin autenticadas
- ✅ Troca de domínio de produção não requer deploy de código — apenas atualização da variável de ambiente
- ⚠️ Lembrar de atualizar `ALLOWED_ORIGINS` ao adicionar novos subdomínios ou ambientes (staging, preview)
- ⚠️ Em desenvolvimento local, qualquer porta diferente de `3003` precisará ser adicionada ao `.env` local
