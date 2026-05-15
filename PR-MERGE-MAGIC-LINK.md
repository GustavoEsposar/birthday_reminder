# 🚀 Implementação: Magic Link de Coleta de Aniversários (MVP)

## 📋 O que foi feito (Resumo)
Implementação da primeira fase (MVP) da funcionalidade "Magic Link". Esta funcionalidade permite que o usuário crie um link único, público e com data de expiração (24h, 3 dias, 7 dias ou 30 dias), para solicitar o aniversário de seus contatos. 

Os contatos acessam a página e preenchem anonimamente Nome e Data. Essas entradas ficam retidas em uma fila de **Aprovação Pendente** no Dashboard do dono, que é notificado no mesmo instante por E-mail/Telegram. O dono decide então se aprova (adicionando permanentemente) ou rejeita a solicitação.

---

## 🛠 Alterações Técnicas

### 🗄️ Modelos e Banco de Dados
- **`InviteLink`**: Nova collection para rastrear a autoria do link, token hexadecimal seguro (16 caracteres) e validade (com TTL integrado ao MongoDB).
- **`PendingBirthdate`**: Nova collection projetada para manter o ciclo de vida da aprovação totalmente separado da collection de `Pessoa`, garantindo que links expirados não cancelem aprovações que ainda estão pendentes.

### ⚙️ Backend (Controllers, Services & API)
- **`InviteLinkService`**: Implementado do zero para focar nas regras de negócio (geração e invalidação do link único por usuário).
- **`PublicInviteController`** e `publicInviteRoutes`: Rotas sem autenticação (`/invite/:token`) responsáveis pela renderização do formulário público e recebimento do input.
- **`InviteController`** e `inviteRoutes`: Rotas autenticadas do dono para gerar/desativar links e interagir com os cards pendentes (`/app/invite/approve`, `/app/invite/reject`).
- **`EmailService` & `TelegramBot`**: Integração do novo gatilho de notificação para avisar o dono quando uma submissão for recebida.
- **Performance no SSR:** No controller do dashboard, a carga de dados `Pessoa` e `PendingBirthdate` foi paralelisada via `Promise.all` para evitar atrasos no TTFB e mitigar layout shifts.

### 🎨 Frontend & UI (EJS, CSS, JS)
- **Dashboard - Pendentes (`.pendentes-wrapper`)**: 
  - Estrutura projetada como *irmão* do painel principal de pessoas (sem acoplar ou hackear o CSS grid já existente). 
  - JS de delegação de eventos das ações de Aprovar/Rejeitar totalmente isolado da lista de cartões normais.
  - Transição contínua: ao clicar em "Aprovar", injeta dinamicamente o novo cartão na lista definitiva, sem reload da página (`injectPessoaCard`).
- **Páginas Públicas Dedicadas**: 
  - `invite-form.ejs`: Tela limpa com contexto visual minimalista de quem solicitou a data.
  - `invite-expired.ejs`: Fallback claro e amigável para quando o token já estiver inativo.
  - `invite-success.ejs`: Feedback pós-envio com bloqueio simples via `sessionStorage` para evitar duplo-clique.
- **Settings**: Painel de gerenciamento do Magic Link em `/app/settings` contendo as opções de geração, cancelamento e visualização rápida via botão "Copiar URL".

---

## 🛡️ Decisões de Arquitetura e Segurança
1. **Separação de Collections**: Pendentes foram alocados em collection própria para evitar inchaço desnecessário na collection `Pessoa`.
2. **Tokens Longos**: Adotou-se Hex de 16 caracteres (`crypto.randomBytes(8)`) para a URL pública em vez dos IDs curtos, blindando contra brute-force nas rotas não-autenticadas.
3. **Link Único:** Mantido limite de apenas 1 link ativo por dono de forma simultânea — garantir que o envio e processamento continue transparente para o usuário e gere nova URL caso ele recrie (invalidando a antiga).
4. **Tratamento Seguro de Submissões:** A página expõe exclusivamente NOME e DATA; dados que também passam pelo pipeline de sanitização do core (`sanitizer.ts`).

## 📸 Como Testar
1. Acesse o menu de *Settings*, e na seção "Link de Convite", selecione uma duração e clique em **Gerar Link**.
2. Copie o link e abra em uma aba anônima (para simular a visão do Submitter).
3. Insira um nome fictício e uma data válida. Envie o formulário.
4. Verifique a notificação de e-mail ou Telegram (se configurados).
5. Retorne ao Dashboard (autenticado) para visualizar o Card com a tag de `Pendente`.
6. Experimente Rejeitar e Aprovar. Ao aprovar, veja o item integrar a lista de datas confirmadas.
