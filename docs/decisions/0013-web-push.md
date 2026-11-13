# 0013 · Avisos com a aba fechada por Web Push

**Contexto.** Com a aba aberta, o cronômetro já avisa o fim do bloco pela Notification API. Com a aba fechada, só um servidor consegue avisar.

**Escolha.**
- **Envio.** Web Push com chaves VAPID, montado com `@pushforge/builder`, que usa Web Crypto e roda no Worker. A chave privada é o segredo `VAPID_PRIVATE_KEY`; a pública fica na var `VAPID_PUBLIC_KEY` e chega ao app por `/api/config`.
- **Assinaturas.** Tabela `push_subscriptions`, uma linha por navegador, que some junto com a conta. Assinaturas que o serviço de push dá como expiradas (404 ou 410) são apagadas no envio.
- **Fim de bloco.** Ao começar ou retomar o cronômetro de um bloco, o app agenda `POST /api/push/fim-de-bloco`. Esse pedido vira um alarme no Durable Object do usuário (`UserHub`). Pausar, descartar, registrar ou o aviso com a aba aberta cancela o alarme.
- **Revisões.** Um cron diário (11h UTC, 8h em Brasília) manda um lembrete a quem tem revisões vencidas. É no máximo um por dia: o produto não insiste.
- **No app.** O service worker (`apps/web/public/sw.js`) só mostra o aviso e abre o app no lugar certo; não guarda cache. Os avisos são opcionais e ficam na Conta, em "Avisos". Tudo fica atrás de `platform.push`; no app nativo, entram notificações locais.

**Pendência.** Gerar as chaves VAPID de `preview` e `production` no deploy (`bunx @pushforge/builder vapid`).

**Descartado.**
- `web-push`: depende de APIs do Node que não existem no Worker.
- Cron por minuto para o fim de bloco: seria impreciso e caro. O alarme do Durable Object dispara no horário exato.
