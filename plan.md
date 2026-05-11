# Plano de Funcionalidade: Magic Link de Coleta de Aniversários

## Entendimento Consolidado

| Ponto | Decisão |
|---|---|
| Ciclo de vida do link | Expiração configurável pelo usuário (24h, 3d, 7d, 30d) |
| Submitter | Anônimo — preenche apenas nome + data de aniversário |
| Campos do formulário | Fixos no MVP (nome + data); arquitetura preparada para customização futura |
| URL do link | Token aleatório — ex: `reminder.com/invite/x9f2kp` |
| Fluxo de aprovação | Entradas ficam **pendentes** até o dono aprovar ou rejeitar |
| Notificação ao dono | Imediata via canal configurado (email ou Telegram), com link direto para a seção de pendentes |
| Fallback de aprovação | Seção de pendentes no dashboard |
| Links simultâneos | Apenas 1 ativo por vez — gerar novo invalida o anterior |
| Cancelamento antecipado | Permitido — usuário pode desativar o link antes de expirar |
| Calendários externos | Fora de escopo desta fase |

---

## Premissas

1. O token do link será gerado com `crypto.randomBytes(8).toString('hex')` → 16 chars hex, resistente a brute force em rota pública
2. A página do formulário (`/invite/:token`) é pública — sem autenticação, sem navbar do app
3. Após submeter, o submitter vê confirmação e não consegue reenviar naquela sessão de browser (bloqueio via `sessionStorage`)
4. O link expirado ou inválido retorna página de erro amigável
5. Entradas rejeitadas são descartadas permanentemente (sem histórico de rejeições no MVP)
6. O link rápido na notificação aponta para `/app?section=pending` — requer login, não é aprovação one-click sem auth

---

## Novos Modelos de Dados

### `InviteLink`

```typescript
interface IInviteLink extends Document {
    userId: mongoose.Types.ObjectId;  // dono do link
    token: string;                     // 16-char hex único
    expiresAt: Date;                   // calculado no momento da geração
    createdAt: Date;
}
```

> TTL index em `expiresAt` para auto-deleção pelo MongoDB.

### `PendingBirthdate`

```typescript
interface IPendingBirthdate extends Document {
    ownerId: mongoose.Types.ObjectId;     // userId do dono do link
    inviteLinkId: mongoose.Types.ObjectId;
    name: string;
    date: Date;
    submittedAt: Date;
}
```

> Separado do `InviteLink` para facilitar queries de aprovação independentemente do link já ter expirado.

### Alteração em `TokenType` (sem mudança)

O `TokenService` existente **não é reutilizado** para o invite link — os requisitos são diferentes (TTL variável, rota pública, token mais longo). Um `InviteLinkService` dedicado será criado.

---

## Novos Endpoints

### Autenticados (dono do link)

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/app/invite/generate` | Gera novo link (invalida anterior se existir) |
| `DELETE` | `/app/invite` | Desativa o link ativo antes de expirar |
| `GET` | `/app/invite/pending` | Retorna entradas pendentes |
| `POST` | `/app/invite/approve/:pendingId` | Aprova entrada → move para `birthdates[]` |
| `POST` | `/app/invite/reject/:pendingId` | Rejeita e descarta entrada |

### Públicos (sem autenticação)

| Método | Rota | Ação |
|---|---|---|
| `GET` | `/invite/:token` | Renderiza página pública do formulário |
| `POST` | `/invite/:token/submit` | Recebe nome + data, cria `PendingBirthdate` e notifica dono |

---

## Fluxo Completo

```
[Dono]
  └─ Abre Settings → clica "Gerar Link de Convite" → escolhe duração
  └─ POST /app/invite/generate → salva InviteLink no banco → exibe URL copiável

[Submitter]
  └─ Recebe link pelo WhatsApp/grupo → clica
  └─ GET /invite/:token → valida expiração → exibe formulário (nome + data)
  └─ Preenche e envia → POST /invite/:token/submit
       └─ Valida campos → cria PendingBirthdate
       └─ Notifica dono (email/Telegram com link para /app?section=pending)
       └─ Retorna página de confirmação ao submitter

[Dono — aprovação]
  └─ Recebe notificação → clica link → vai para /app?section=pending
  └─ Vê lista de pendentes no dashboard
  └─ Clica "Aprovar" → POST /app/invite/approve/:pendingId
       └─ Move entry para Pessoa.birthdates[]
       └─ Deleta PendingBirthdate
  └─ Ou clica "Rejeitar" → POST /app/invite/reject/:pendingId
       └─ Deleta PendingBirthdate
```

---

## Alterações na UI

### Settings (`/app/settings`)

- **Nova seção: "Link de Convite"**
  - Estado vazio: botão "Gerar Link" + dropdown de duração
  - Estado ativo: exibe URL com botão "Copiar", badge de expiração ("Expira em 6 dias"), botão "Cancelar Link"

### Dashboard (`/app`)

- **Nova seção: "Pendentes"** (visível apenas se houver entradas)
  - Card para cada entrada com nome, data, botões "Aprovar" e "Rejeitar"
  - Badge de contagem no navbar quando houver pendentes

---

## Novos Arquivos a Criar

```
src/
  models/
    InviteLink.ts
    PendingBirthdate.ts
  services/
    InviteLinkService.ts
  controllers/
    InviteController.ts         ← rotas autenticadas do dono
    PublicInviteController.ts   ← rotas públicas do submitter
  routes/
    inviteRoutes.ts             ← autenticadas
    publicInviteRoutes.ts       ← públicas
  views/
    invite-form.ejs             ← página pública do formulário
    invite-expired.ejs          ← página de link expirado/inválido
    invite-success.ejs          ← confirmação ao submitter
  templates/
    inviteNotificationTemplate.html  ← email de nova entrada pendente
```

---

## Fases de Implementação

### MVP (implementar agora)

1. Modelos `InviteLink` e `PendingBirthdate`
2. `InviteLinkService` (gerar, validar, cancelar)
3. Rotas e controllers públicos (`/invite/:token` e `/invite/:token/submit`)
4. Rotas e controllers autenticados (gerar, cancelar, listar pendentes, aprovar, rejeitar)
5. Views públicas (formulário, expirado, confirmação)
6. Seção de pendentes no dashboard
7. Seção de link ativo/geração nas settings
8. Notificação ao dono (email + Telegram)

### Fase 2 (futura)

- Campos customizáveis no formulário (além de nome e data)
- Histórico de entradas aprovadas com origem "via link"
- Contador de submissões por link

---

## Riscos e Casos de Borda

| Risco | Mitigação |
|---|---|
| Spam via link público | Rate limiting por IP no endpoint `/invite/:token/submit` |
| Token descoberto por força bruta | Token de 16 chars hex = 2^64 possibilidades; adicionar rate limit de tentativas |
| Link expirado no banco antes do MongoDB rodar o TTL | Validar `expiresAt > Date.now()` na query, não confiar apenas no TTL |
| Usuário aprova entrada de link já expirado | `PendingBirthdate` persiste independente do link — aprovação ainda é possível |
| Nome ou data inválidos no submit público | Validação + sanitização idêntica ao `addBirthdate` existente |
| Múltiplos submits do mesmo browser | Bloqueio via `sessionStorage` no frontend (não é garantia, mas suficiente para UX) |

---

## Decision Log

| Decisão | Alternativas consideradas | Motivo da escolha |
|---|---|---|
| `PendingBirthdate` como coleção separada | Embutir em `InviteLink` ou em `Pessoa` | Queries de aprovação independem do link; evita arrays crescentes em `Pessoa` |
| Token de 16 chars hex | Reutilizar `TokenService` (6 chars) | Rota pública exige token maior; TTL variável não é suportado pelo modelo atual |
| Link rápido na notificação aponta para `/app?section=pending` (requer login) | Link de aprovação one-click sem auth | Evita surface de ataque adicional; simplifica auth flow |
| 1 link ativo por vez | Múltiplos links simultâneos | Reduz complexidade do MVP; caso de uso real não exige múltiplos |
| Campos fixos no MVP | Formulário customizável desde o início | YAGNI — customização é complexidade desnecessária agora |
