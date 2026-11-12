# 0009 · E-mail em log até existir domínio

**Contexto.** O Cloudflare Email Service precisa de um domínio na conta, e o projeto ainda não tem um.

**Escolha.** O envio fica atrás da interface `Mailer` (`apps/api/src/auth/mailer.ts`), com dois modos:
- `log` (`EMAIL_MODE=log`): a mensagem, com o link, vai para o log do Worker. Para ver em `preview`, use `wrangler tail --env preview`.
- `memory`: guarda as mensagens para os testes lerem.

Quando houver domínio, entra um modo que usa o binding do Email Service, e `preview` e `production` passam a enviar e-mails de verdade.

**Sem envio real (`EMAIL_MODE=log`), o app só oferece o que funciona** (`emailEnabled` em `apps/api/src/env.ts`):
- O cadastro não exige confirmação: a conta entra logada na hora.
- A recuperação de senha fica desligada na API, e a tela avisa que chega em breve.
- A exclusão de conta continua funcionando, porque pede a senha.

**Ao ligar o envio real:** as contas criadas antes ficam com o e-mail não confirmado. No primeiro login, elas recebem o link de confirmação.
