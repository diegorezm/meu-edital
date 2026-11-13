# 0002 · Um Worker com Hono para API e app

**Contexto.** O app web precisa de sessão por cookie simples e sem CORS.

**Escolha.**
- Um único Worker (`apps/api`) serve a API em `/api/*`, com Hono.
- O mesmo Worker serve o build de `apps/web` como static assets, com `run_worker_first: ["/api/*"]` e `not_found_handling: "single-page-application"`.
- Como app e API dividem a origem, o cookie de sessão é `HttpOnly`, `Secure` e `SameSite=Lax`.

O app não usa o cliente tipado (`hc` do Hono): importar os tipos do Worker no app web traria os tipos do runtime de Workers para um projeto com DOM.

**Descartado.**
- Dois Workers, um para o app e outro para a API: exigiria CORS e cookie entre origens.
- Pages: para projetos novos, a Cloudflare recomenda Workers com static assets.
