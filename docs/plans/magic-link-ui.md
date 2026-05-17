# Plano de UI: Magic Link de Coleta de Aniversários

> **Status:** ✅ Implementado — PR [#12](../../../pull/12) — 2026-05-10  
> **Plano de backend:** [magic-link.md](./magic-link.md)  
> **Voltar ao sumário:** [SUMMARY.md](../SUMMARY.md)

---

## 1. Dashboard — Seção de Pendentes

### Análise: Container separado vs. dentro de `.pessoas`

A proposta de usar `.pessoa-pendente` em vez de `.pessoa` é a decisão correta.  
A dúvida é onde posicionar esses cards no DOM.

#### Opção A — Wrapper dentro de `.pessoas` (primeiro filho)

```html
<div class="pessoas">
    <div class="pendentes-wrapper"> <!-- grid-column: 1 / -1 -->
        <h4>Aguardando aprovação</h4>
        <div class="pessoas-pendentes"><!-- .pessoa-pendente cards --></div>
    </div>
    <form id="inline-add-form" ...></form>
    <!-- .pessoa cards normais -->
</div>
```

| Prós | Contras |
|---|---|
| Event delegation do delete já está no `.pessoas` — reaproveita o escopo | `.dashboard .pessoas` usa `display: grid` 2 colunas — o wrapper precisa de `grid-column: 1 / -1` explícito para não quebrar o layout |
| Um único container pai para todos os cards | Quando `hidden`, o wrapper ainda ocupa uma célula do grid se não for `display:none` estrito |
| Lógica de sort/search já ignora `.pessoa-pendente` naturalmente | CSS dos filhos do wrapper conflita com `.dashboard .pessoas .pessoa` (seletor profundo já estilizado) |

#### Opção B — Wrapper irmão, antes de `.pessoas` ✅ Recomendada

```html
<div class="pendentes-wrapper hidden">
    <h4 class="pendentes-titulo">Aguardando aprovação <span class="pendentes-count"></span></h4>
    <div class="pessoas-pendentes"><!-- .pessoa-pendente cards --></div>
</div>
<div class="pessoas">
    <form id="inline-add-form" ...></form>
    <!-- .pessoa cards normais -->
</div>
```

| Prós | Contras |
|---|---|
| Zero acoplamento com o grid de `.pessoas` — sem `grid-column` hacks | Event delegation de aprovar/rejeitar vai num segundo container (mas isso é **mais limpo**, não é um problema) |
| `display:none` quando vazio não afeta o fluxo de `.pessoas` | JS precisa referenciar um segundo elemento além de `.containerPessoas` |
| Layout dos pendentes é completamente independente (pode ser 1 coluna, horizontal, etc.) | — |
| Aparece naturalmente **antes** do form e dos cards sem precisar manipular DOM order | — |
| Isola os seletores CSS — `.pessoas-pendentes .pessoa-pendente` não conflita com nada existente | — |

**Decisão: Opção B.** O grid do `.pessoas` já tem CSS específico e profundo. Colocar um wrapper filho que precisa ser tratado diferente de todos os outros filhos cria dívida técnica imediata. Irmão antes é mais simples, mais limpo e preserva a independência de layout.

---

### Template do Card Pendente

Análogo ao `card-pessoa-template`, mas com ações de aprovar/rejeitar:

```html
<template id="card-pendente-template">
    <div class="pessoa-pendente sobrepor" data-pending-id="">
        <span class="pendente-badge">Pendente</span>
        <h3 class="card-name"></h3>
        <p class="card-date"></p>
        <div class="pendente-actions">
            <button class="approve-btn" data-pending-id="" title="Aprovar">
                <span class="material-symbols-outlined">check</span>
            </button>
            <button class="reject-btn" data-pending-id="" title="Rejeitar">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
    </div>
</template>
```

**Notas:**
- Não há `<form>` — as ações são chamadas via `fetch` diretamente pelos botões
- `data-pending-id` nos botões evita `closest()` e torna o handler mais explícito
- `.pendente-badge` é um label visual que deixa claro para o dono que aquele card ainda não é uma "pessoa" confirmada

---

### Estrutura Final do Dashboard EJS

```html
<%-- Renderizado condicionalmente pelo servidor --%>
<% if (pendingEntries && pendingEntries.length > 0) { %>
<div class="pendentes-wrapper">
    <h4 class="pendentes-titulo">
        Aguardando aprovação
        <span class="pendentes-count">(<%= pendingEntries.length %>)</span>
    </h4>
    <div class="pessoas-pendentes">
        <% pendingEntries.forEach(entry => {
            const date = new Date(entry.date);
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            const formattedDate = `${day}/${month}/${year}`;
        %>
        <div class="pessoa-pendente sobrepor" data-pending-id="<%= entry._id %>">
            <span class="pendente-badge">Pendente</span>
            <h3 class="card-name"><%= entry.name %></h3>
            <p class="card-date"><%= formattedDate %></p>
            <div class="pendente-actions">
                <button class="approve-btn" data-pending-id="<%= entry._id %>" title="Aprovar">
                    <span class="material-symbols-outlined">check</span>
                </button>
                <button class="reject-btn" data-pending-id="<%= entry._id %>" title="Rejeitar">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>
        <% }) %>
    </div>
</div>
<% } %>

<div class="pessoas">
    <form id="inline-add-form" ...> ... </form>
    <template id="card-pessoa-template"> ... </template>
    <%- /* loop de .pessoa existente */ %>
</div>
```

---

### JS — Handler de Aprovação/Rejeição

Event delegation no `pendentes-wrapper` — isolado do handler de delete:

```javascript
// Separado do listener de '.pessoas' — sem acoplamento
const pendentesWrapper = document.querySelector('.pendentes-wrapper');

if (pendentesWrapper) {
    pendentesWrapper.addEventListener('click', async function (e) {
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');

        if (!approveBtn && !rejectBtn) return;

        const pendingId = (approveBtn || rejectBtn).dataset.pendingId;
        const action = approveBtn ? 'approve' : 'reject';
        const card = document.querySelector(`.pessoa-pendente[data-pending-id="${pendingId}"]`);

        try {
            const response = await fetch(`/app/invite/${action}/${pendingId}`, { method: 'POST' });
            const result = await response.json();

            if (response.ok) {
                showToast(result.message, 'success');
                card?.remove();

                // Se aprovado, injeta como .pessoa no container normal
                if (action === 'approve' && result.birthdate) {
                    injectPessoaCard(result.birthdate); // função auxiliar que clona o template
                }

                // Esconde o wrapper se não houver mais pendentes
                const remaining = pendentesWrapper.querySelectorAll('.pessoa-pendente');
                if (remaining.length === 0) pendentesWrapper.classList.add('hidden');
            } else {
                showToast(result.error || 'Erro', 'error');
            }
        } catch {
            showToast('Erro de comunicação com o servidor', 'error');
        }
    });
}
```

**Nota:** A função `injectPessoaCard` reutiliza o `card-pessoa-template` existente — aprovação injeta o card direto no `.pessoas` sem reload.

---

## 2. Performance — Estratégia de Pré-renderização

### O problema levantado

`Pessoa.birthdates` está **embutido** no documento do usuário — já é trazido na query atual.  
`PendingBirthdate` é uma **coleção separada** — requer query adicional.

Se as queries rodarem em sequência, o TTFB aumenta. Se uma for client-side, há layout shift e complexidade de JS.

### Solução: `Promise.all` no servidor ✅

```typescript
// getDashboard — antes
const user = await Pessoa.findById(req.session.userId);

// getDashboard — depois
const [user, pendingEntries] = await Promise.all([
    Pessoa.findById(req.session.userId),
    PendingBirthdate.find({ ownerId: req.session.userId })
]);

res.render('dashboard', {
    title: 'Birthday Reminder - Dashboard',
    user,
    pendingEntries,
    extraScripts: [...]
});
```

| Estratégia | TTFB | Layout Shift | Complexidade |
|---|---|---|---|
| Queries sequenciais no servidor | `query1 + query2` | Nenhum | Baixa |
| **Promise.all no servidor** ✅ | `max(query1, query2)` | **Nenhum** | **Baixa** |
| Birthdates SSR + Pending via fetch | `query1` | **Sim** (pop-in) | Alta |

**Decisão: `Promise.all` no servidor.** As queries são independentes e podem ser paralelizadas sem custo adicional de complexidade. Para o volume esperado de pendentes (poucos por usuário), a query é trivial. Se no futuro se tornar um gargalo, migrar para lazy load client-side é um refactor pontual no controller e na view.

---

## 3. Settings — Seção do Link de Convite

### Layout da Seção

**Estado vazio (nenhum link ativo):**
```
┌─────────────────────────────────────────┐
│  Link de Convite                        │
│                                         │
│  Duração: [ 24h ▾ ]  [ Gerar Link ]    │
└─────────────────────────────────────────┘
```

**Estado ativo (link gerado):**
```
┌─────────────────────────────────────────┐
│  Link de Convite                        │
│                                         │
│  reminder.com/invite/x9f2kp  [ Copiar ] │
│  Expira em: 6 dias e 14 horas           │
│                                         │
│  [ Cancelar Link ]                      │
└─────────────────────────────────────────┘
```

**Componentes:**
- Dropdown de duração: `<select>` com opções `24h | 3 dias | 7 dias | 30 dias`
- Botão "Gerar Link": `POST /app/invite/generate`
- Campo de URL: `<input readonly>` com botão de copiar via `navigator.clipboard.writeText()`
- Exibição de expiração: calculada no frontend com `expiresAt` retornado pela API
- Botão "Cancelar Link": `DELETE /app/invite` com confirmação inline

---

## 4. Páginas Públicas

### `/invite/:token` — Formulário

Página standalone (sem navbar do app, sem sessão):

```
┌─────────────────────────────────────────┐
│  🎂  Birthday Reminder                  │
│                                         │
│  Gustavo quer saber seu aniversário!    │
│                                         │
│  Seu nome:  [________________________]  │
│  Seu aniversário: [__/__/____]          │
│                                         │
│  [ Enviar ]                             │
└─────────────────────────────────────────┘
```

**Notas:**
- O nome do dono do link (`user.name`) é exibido para dar contexto ao submitter
- Sem campos de email ou login — formulário mínimo proposital
- Após submit bem-sucedido: redireciona para `/invite/:token/success` ou renderiza inline a mensagem de confirmação

### `/invite/:token` — Link expirado/inválido

```
┌─────────────────────────────────────────┐
│  🎂  Birthday Reminder                  │
│                                         │
│  Este link expirou ou não existe.       │
│  Peça um novo link ao seu contato.      │
└─────────────────────────────────────────┘
```

### Confirmação pós-submit

Renderizada na mesma rota ou como view separada — não redireciona para lugar nenhum:

```
┌─────────────────────────────────────────┐
│  🎂  Birthday Reminder                  │
│                                         │
│  Enviado com sucesso!                   │
│  Seu aniversário foi registrado.        │
└─────────────────────────────────────────┘
```

---

## 5. Novos Arquivos CSS

```
public/css/
  pendentes.css    ← estilos do .pendentes-wrapper, .pessoa-pendente, .pendente-badge
  invite.css       ← estilos das páginas públicas (/invite/:token)
```

Manter separado do `dashboard.css` para não poluir o escopo de `.dashboard .pessoas`.

---

## Decision Log — UI

| Decisão | Alternativas | Motivo |
|---|---|---|
| `.pendentes-wrapper` como irmão de `.pessoas` | Primeiro filho dentro de `.pessoas` | Grid 2 colunas do `.pessoas` exigiria `grid-column: 1/-1` hacks; irmão isola completamente o layout |
| `.pessoa-pendente` como classe nova | Reutilizar `.pessoa` com modifier | Evita conflitos com sort (`querySelectorAll(".pessoa")`) e com delete (`form.closest('.pessoa')`) |
| Event delegation no `.pendentes-wrapper` | Listeners individuais em cada botão | Funciona para cards injetados dinamicamente pós-aprovação de outros, sem re-registrar listeners |
| `Promise.all` SSR para pendentes | Fetch client-side lazy | → Ver [ADR-003](../decisions/ADR-003-promise-all-ssr-queries-paralelas.md) |
| Aprovação injeta card via `card-pessoa-template` | Reload da página | Consistência com o comportamento de add inline já existente |
