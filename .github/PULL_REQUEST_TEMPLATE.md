## O que esse PR faz

<!-- Uma ou duas frases descrevendo a mudança -->

## Checklist

### Código
- [ ] Funcionalidade testada manualmente no fluxo principal
- [ ] Casos de borda considerados

### Documentação
- [ ] Esta mudança **não** atende ao critério de plano escrito¹
- [ ] **OU** plano criado/atualizado em `docs/plans/`
- [ ] Novas decisões arquiteturais globais registradas em `docs/decisions/`
- [ ] `docs/SUMMARY.md` atualizado (dashboard + índice de ADRs se aplicável)

### Segurança *(marcar se aplicável)*
- [ ] Nenhuma rota nova exposta sem autenticação sem justificativa
- [ ] Inputs de usuário validados e sanitizados
- [ ] Nenhum segredo hardcoded

---

> ¹ **Critério de plano obrigatório:** nova regra de negócio com impacto no modelo de dados, refatoração arquitetural, considerações de segurança **e** esforço de tempo considerável. Ver [ADR-000](../docs/decisions/ADR-000-convencao-documentacao.md).
