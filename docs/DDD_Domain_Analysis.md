# Análise de Domínio e Context Mapping (DDD) - Birthday Reminder

Este documento foi criado para ajudá-lo a entender os conceitos do **Domain-Driven Design (DDD)** aplicando-os diretamente ao projeto que você construiu. 

Como você mencionou, o projeto foi inicialmente pensado com base em casos de uso UML e requisitos simples. Essa é uma abordagem muito comum e perfeitamente funcional (chamada frequentemente de *Data-Driven* ou focada no Banco de Dados). O DDD propõe uma mudança de mentalidade: **focar no comportamento e nas fronteiras lógicas do negócio**, e não apenas em como os dados são salvos.

---

## 1. O Cenário Atual vs. A Visão DDD

No seu código atual, a modelagem foi bastante centralizada no Mongoose. A model `Pessoa.ts` é o que chamamos no DDD de um **"Objeto Deus" (God Object)**. Ela concentra:
- Dados de Autenticação (`password`, `email`, `isVerified`).
- Configurações do Domínio Core (`cron`, `notificationChannels`, `chatId`).
- Dados filhos embutidos (`birthdates`).

Embora isso funcione perfeitamente para um projeto pequeno a médio, no DDD nós quebramos essa estrutura monolítica em **Contextos Delimitados (Bounded Contexts)**. Cada contexto tem sua própria responsabilidade e, muitas vezes, a "Pessoa" significa coisas diferentes para contextos diferentes.

---

## 2. Os Bounded Contexts (Contextos Delimitados)

Se fôssemos redesenhar o *Birthday Reminder* sob a ótica estrita do DDD, teríamos 4 Bounded Contexts principais:

### A. Contexto de Identidade e Acesso (IAM - Identity & Access Management)
- **Responsabilidade:** Garantir que o usuário é quem diz ser e proteger a conta.
- **Entidades/Agregados:** `User` (Usuário), `Token`.
- **Linguagem Ubíqua (Ubiquitous Language):** Login, Senha, Verificação de E-mail, Recuperação, Autenticação.

### B. Contexto Principal de Lembretes (Reminder Core Context)
- **Responsabilidade:** O "coração" do seu software. É aqui que o valor real do negócio existe: gerenciar os aniversários que importam e calcular quando avisar.
- **Entidades/Agregados:** `Account` (A Conta do usuário neste contexto), `Birthdate` (O aniversário rastreado).
- **Linguagem Ubíqua:** Cron, Fuso Horário, Aniversariantes, Preferências de Notificação.

### C. Contexto de Colaboração (Collaboration Context)
- **Responsabilidade:** Permitir que terceiros interajam com o sistema sem precisarem de uma conta, através de links públicos.
- **Entidades/Agregados:** `InviteLink` (Convite), `PendingBirthdate` (Aniversário Pendente).
- **Linguagem Ubíqua:** Link Público, Submissão, Aprovação, Rejeição.

### D. Contexto de Notificação (Notification Context)
- **Responsabilidade:** Um serviço puramente de infraestrutura/domínio que sabe *como* enviar mensagens para o mundo externo, mas não se importa *por que* estão sendo enviadas.
- **Linguagem Ubíqua:** Payload, Canal (Telegram, Email), Disparo, Lote (Batch).

---

## 3. Entidades, Agregados e Value Objects

No DDD, os dados não são apenas "tabelas". Eles são classificados por como se comportam:

1. **Entity (Entidade):** Tem uma identidade única que persiste com o tempo. 
   - *Exemplo:* O `InviteLink` é uma entidade. Mesmo que a data de expiração mude, ele ainda é o mesmo link (possui um `_id`).
   
2. **Value Object (Objeto de Valor):** Não tem identidade própria, importa apenas o seu valor. Se dois Value Objects tiverem os mesmos dados, eles são considerados iguais.
   - *Exemplo:* O `Birthdate` (nome e data) embutido na `Pessoa`. Se você deletar e recriar um "João - 10/10", não faz diferença, o valor é o que importa.

3. **Aggregate Root (Raiz de Agregação):** É a entidade "mãe" que garante a consistência das outras entidades menores e value objects dentro dela. 
   - *Exemplo:* A sua `Pessoa` hoje age como um Aggregate Root. Você não consegue salvar um `Birthdate` solto no banco; você sempre carrega a `Pessoa`, adiciona o `Birthdate` na lista dela, e salva a `Pessoa`. A `Pessoa` protege as regras de negócio de `Birthdate`.

---

## 4. O Mapa de Contextos (Context Mapping)

O **Context Mapping** define como esses contextos independentes conversam entre si. Como você pediu, aqui está o mapeamento dos relacionamentos no seu sistema:

### IAM (Upstream) ➔ Reminder Core (Downstream)
- **Padrão:** *Customer/Supplier* ou *Shared Kernel*.
- **Como funciona:** O IAM autentica o usuário e gera uma sessão. O Core confia no IAM. O IAM dita o identificador único (`userId`) que o Core usará para amarrar a `Account`. 
- **O que evitar:** O Core não deveria saber se a senha do usuário está criptografada com `bcrypt`. Essa é uma preocupação vazando do IAM.

### Collaboration (Upstream) ➔ Reminder Core (Downstream)
- **Padrão:** *Anti-Corruption Layer (ACL)*.
- **Como funciona:** O contexto de colaboração capta dados "sujos" do mundo exterior (`PendingBirthdate`). O Core não aceita lixo. O momento em que o usuário clica em "Aprovar" no Dashboard é a **Camada Anticorrupção**: O sistema pega a entidade `PendingBirthdate`, extrai apenas os dados válidos, transforma em um `Birthdate` (Value Object puro) e o anexa na `Account` do Core. 
- O Core permanece limpo e protegido das regras de convites expirados, tokens públicos, etc.

### Reminder Core (Upstream) ➔ Notification Context (Downstream)
- **Padrão:** *Publisher/Subscriber* ou *Conformist*.
- **Como funciona:** O Job de Notificação (`notificationJob.ts`) roda no Core. O Core determina **quem** faz aniversário. Depois, o Core monta um "pacote de ordens de notificação" e joga para os `Services` (Email, Telegram).
- O Notification Context apenas recebe um contrato do tipo: `[ { contato: "email", mensagem: "X" } ]` e dispara. Ele não tem que saber o que é um `PendingBirthdate` ou um `Token` de recuperação.

---

## 5. Matriz de Contratos (Visão Abstrata)

| De (Contexto) | Para (Contexto) | Objeto Trafegado (Contrato) | O que acontece |
| :--- | :--- | :--- | :--- |
| **IAM** | **Core** | `Auth Token / Session ID` | O Core valida a identidade para liberar o Dashboard. |
| **Collaboration** | **Core** | `PendingBirthdateDTO` | O Core converte o pendente aprovado em um `Birthdate` interno. |
| **Core** | **Notification** | `NotificationCommand` | O Core ordena que o sistema de mensagens faça disparos. |
| **IAM** | **Notification** | `EmailVerifyCommand` | O IAM também usa Notificação para enviar tokens de recuperação e verificação. |

---

## Conclusão e Reflexão

Você não precisa reescrever todo o seu software para que ele tenha pastas `src/contexts/iam`, `src/contexts/core`, etc. (isso seria *Clean Architecture* / Arquitetura Hexagonal, que costuma acompanhar o DDD).

No entanto, **entender o DDD ajuda você a escrever um código melhor hoje:**
1. Quando for mexer no código de `TelegramBot`, lembre-se de que ele não deve alterar dados de senha (pois pertencem ao IAM).
2. O seu `notificationJob.ts` hoje está altamente acoplado à tabela `Pessoa`. Numa visão DDD, o Job (Core) geraria eventos, e o `EmailService` e `TelegramService` apenas escutariam esses eventos, sem precisar consultar o banco de dados.
3. Pensar na camada de *Anti-Corruption* ao aprovar aniversários pendentes te ajuda a evitar que bugs do formulário público estraguem os dados reais da conta do usuário.

O seu projeto atual já tem fronteiras bem lógicas (as divisões em `services`, `controllers`, `models` e `jobs` estão muito boas). O DDD simplesmente te dá um vocabulário arquitetural para escalar esse projeto de forma que equipes diferentes pudessem trabalhar no IAM e no Core sem quebrar o código um do outro.
