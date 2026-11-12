# 0004 · Better Auth com cookie e bearer

**Contexto.** Precisamos de e-mail e senha, Google, verificação de e-mail, recuperação de senha e exclusão de conta, sem serviço externo. O app mobile (Capacitor) não consegue usar cookie de mesma origem.

**Escolha.** Better Auth sobre o D1, pelo adaptador Drizzle. Fica montado em `/api/auth` e é criado a cada requisição (`apps/api/src/auth/auth.ts`).

- **Verificação e senha.** O cadastro exige confirmar o e-mail. Trocar a senha derruba as outras sessões.
- **Bearer para o app mobile.** O plugin `bearer` faz o login devolver o token no cabeçalho `set-auth-token`. O app vai guardar o token no armazenamento seguro e enviá-lo como `Authorization: Bearer`.
- **Turnstile.** O plugin `captcha` protege o cadastro e o pedido de recuperação de senha. Ele é ligado quando existe `TURNSTILE_SECRET_KEY`, que é um segredo obrigatório.
- **Google.** O login com Google só é ligado quando existem `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Até lá, o app mostra o botão desligado, conforme `/api/config`. Ao configurar as credenciais, acrescente as duas em `secrets.required` no `wrangler.jsonc`.
- **Ids.** As tabelas de auth também usam UUIDv7.
- **Rate limiting.** É feito pelo binding da Cloudflare (`AUTH_LIMITER`), por IP e rota, só em requisições POST. O limitador em memória do Better Auth fica desligado, porque não é compartilhado entre isolates.

**Descartado.**
- Supabase Auth e Clerk: são serviços externos.
- Auth próprio: mais risco e mais trabalho.
- Só cookie: não serve ao app mobile.
