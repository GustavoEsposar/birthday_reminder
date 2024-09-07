# birthday_reminder

## Tecnologias utilizadas
-  [Render: Cloud Application Hosting for Developers](https://render.com/)
- [MongoDB Atlas M0](https://mongodb.com/)
- [UptimeRobot: Free Website Monitoring Service](https://uptimerobot.com/website-monitoring/)
- HTML
- CSS
- Javascript
- Node.js
    - express-server
    - express-session
    - connect-mongo
    - mongoose
    - nodemailer
    - node-cron
    - nodemon

## Propóstio

Esta aplicação de software é um projeto pessoal, desenvolvido como uma prova de conceito com o intuito de, além de satisfazer uma necessidade pessoal, desenvolver novas habilidades de banco de dados e gestão de servidores em nuvem (deploy), além de novas bibliotecas de linguagem.

## Comportamento

Trata-se de uma aplicação que notifica aniversariantes dentro de intervalos de tempo especificos (no dia, 2 dias antes e 1 semana antes).
Para isso foram especificados email's de destinatário e remetente (Gmail), templates genéricos HTML para cada intervalo de notificação e também popular um banco de dados para disponibilizar os dados nas rotinas de processamento.

O node-cron é o core que possibilita programar os disparos de emails de notificação com base em timezones específicas.
Basicamente todo dia num horario especifico uma rotina é disparada para consultar no banco de dados quais regsitros/documentos possuem data de aniversário nos intervalos especificos e com base na resposta obtida, dispara notificações.

## Disclaimer

Todos os artefatos utilizados neste projeto estão livres de direito autoral

A figura a seguir ilustra a notificação recebida pelo destinatário

![exemplo](./public/img/IMG_7440.png)
