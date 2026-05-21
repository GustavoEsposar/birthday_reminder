# Plano: Alterações de Conta com Confirmação por Token

**Feature:** Alterar E-mail e Alterar Senha com verificação em dois estágios  
**Data:** 2026-05-20  
**Commit:** `3b4fc7f` (branch `dev`)  
**Status:** ✅ Implementado

---

## Contexto

As funcionalidades de "Alterar E-mail" e "Alterar Senha" no painel de configurações
utilizavam fluxos de etapa única sem nenhum segundo fator de confirmação:

- **Senha:** submit direto do formulário via `POST /api/users/change-password`
  (rota que sequer existia de forma completa — o método `updateAccountPassword`
  era um stub vazio no controller)
- **E-mail:** não existia

Ambas as operações são sensíveis: permitem sequestrar uma conta se um atacante
obtiver acesso momentâneo a uma sessão ativa. A solução adotada foi um padrão
de **dois estágios via token enviado ao e-mail**, já utilizado na exclusão de conta.

---

## Decisão de Design

### Por que dois estágios e não exigir a senha atual?

O cenário primário do usuário autenticado que quer trocar a senha é justamente
**não lembrar da senha atual**. Exigir a senha antiga eliminaria esse caso de uso,
forçando o usuário a passar pelo fluxo de recuperação público (`/login/recovery`).

A sessão ativa já é evidência de autenticação. O token enviado ao e-mail serve
como segundo fator — garante que somente quem controla a caixa de entrada pode
confirmar a operação.

### Por que guardar o hash da nova senha no `payload` do Token?

Para a troca de senha, o token precisa "carregar" a nova senha de forma que:

1. O usuário **não precise redigitá-la** no segundo estágio (evita UX ruim e
   inconsistências se o usuário abrir o e-mail em outro dispositivo)
2. A senha nunca trafegue em texto puro no corpo da confirmação

O campo `payload` (adicionado ao modelo `Token` anteriormente para o e-mail)
armazena o **hash bcrypt pré-calculado** da nova senha. Na confirmação,
o controller aplica o hash diretamente via `findByIdAndUpdate`, contornando
o middleware `pre('save')` do Mongoose que refaria o hash e corromperia a senha.

Para a troca de e-mail, o `payload` armazena o novo endereço. A decisão de
design é a mesma: o dado sensível viaja junto ao token, não junto à confirmação.

---

## Novos TokenTypes

| Enum | Propósito |
|---|---|
| `EMAIL_CHANGE` | Confirmar troca de endereço de e-mail |
| `PASSWORD_CHANGE` | Confirmar troca de senha estando autenticado |

Ambos distintos de `PASSWORD_RECOVERY` (fluxo público sem sessão) e
`EMAIL_VERIFICATION` (ativação de conta no cadastro).

---

## Fluxo — Alterar E-mail

```
1. Usuário preenche o campo "Novo E-mail" e clica em "Solicitar Alteração"
   → POST /app/settings/generate-change-email-token
   → Valida: campo preenchido, novo e-mail não em uso
   → Gera token EMAIL_CHANGE com payload = novo e-mail
   → Envia token para o NOVO e-mail (não o atual)

2. Campo do novo e-mail é desabilitado; área do token é revelada
   → Botão de confirmação habilitado apenas ao atingir 6 caracteres

3. Usuário insere o token e clica em "Confirmar Alteração"
   → POST /app/settings/confirm-change-email
   → Valida token; extrai novo e-mail do payload
   → Atualiza Pessoa.email
   → Deleta token
   → Página recarrega
```

**Detalhe de segurança:** o token é enviado ao *novo* e-mail, não ao atual.
Isso garante que apenas quem controla o novo endereço pode concluir a troca.

---

## Fluxo — Alterar Senha

```
1. Usuário preenche "Nova Senha" e "Confirmar Nova Senha" e clica em "Solicitar Alteração"
   → POST /app/settings/generate-password-change-token
   → Valida: campos preenchidos, comprimento 8–64, confirmação bate
   → Calcula hash bcrypt da nova senha
   → Gera token PASSWORD_CHANGE com payload = hash calculado
   → Envia token para o e-mail atual da conta

2. Campos de senha são desabilitados; área do token é revelada

3. Usuário insere o token e clica em "Confirmar Alteração"
   → POST /app/settings/confirm-password-change
   → Valida token; extrai hash do payload
   → Aplica hash via findByIdAndUpdate (sem acionar middleware pre-save)
   → Deleta token
   → Página recarrega
```

---

## Padronização de UI

Ambos os cards seguem o mesmo padrão visual já adotado no card "Excluir Conta":

- Classe `.delete-token-area` + `.hidden` para ocultar/revelar a área do token
- Classe `.delete-token-input` no input do token (força maiúsculas, alinha ao centro, `letter-spacing`)
- `::placeholder` com `text-transform: none` e `letter-spacing: normal` para o placeholder não herdar o capslock
- Botão único com classe `.submit-btn` — sem variações de cor (padronizado a pedido)
- Botão de confirmação com atributo `disabled` até atingir 6 caracteres

---

## Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---|---|
| `src/models/Token.ts` | Novos enums `EMAIL_CHANGE` e `PASSWORD_CHANGE`; campo `payload?: string` |
| `src/services/TokenService.ts` | Parâmetro `payload?: string` em `generateToken` |
| `src/services/EmailService.ts` | `customEmail?: string` em `enviarToken` e `enviarEmail`; novos cases no switch |
| `src/controllers/SettingsController.ts` | Import `bcrypt`; métodos `generateChangeEmailToken`, `confirmChangeEmail`, `generatePasswordChangeToken`, `confirmPasswordChange`; stub `updateAccountPassword` removido |
| `src/routes/dashboardRoutes.ts` | 4 novas rotas POST |
| `src/views/dashboard-settings.ejs` | Novo card "Alterar E-mail"; card "Alterar Senha" reescrito no padrão de dois estágios |
| `public/js/settings.js` | Lógica de dois estágios para e-mail e senha; lógica antiga de submit removida |
| `public/css/content.css` | `::placeholder` para `.token-input` |
| `public/css/dashboard-settings.css` | `::placeholder` para `.delete-token-input` |
