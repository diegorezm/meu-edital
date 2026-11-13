# 0014 · App mobile com Capacitor

**Contexto.** O app Android e iOS deve reaproveitar a interface da web sem reescrevê-la. Ele precisa de três coisas que a web não tem:
- armazenamento local que o sistema não apaga;
- cronômetro que sobrevive com a tela desligada;
- avisos com o app fechado.

**Escolha.**
- **Casca.** `apps/mobile` é uma casca Capacitor 8 em torno do build de `apps/web` (`webDir: ../web/dist`). A pasta `android/` é código do projeto e entra no git, mas sem os arquivos web copiados nem `local.properties`. A pasta `ios/` será criada num Mac com `bunx cap add ios`.
- **Uma interface, duas implementações.** Tudo que muda entre as plataformas fica em `apps/web/src/platform` e é escolhido em tempo de execução por `Capacitor.isNativePlatform()`:
  - `web.ts`: IndexedDB, localStorage, Web Push e Notification API;
  - `native.ts`:
    - SQLite (`@capacitor-community/sqlite`) para o banco local;
    - Keystore/Keychain (`@aparajita/capacitor-secure-storage`) para o token;
    - notificações locais;
    - vibração (`@capacitor/haptics`);
    - o plugin próprio `StudyTimer`.
- **Sessão.** No app não há cookie de mesma origem.
  - O login devolve o token (`set-auth-token`), que é guardado no armazenamento seguro e enviado como `Authorization: Bearer`. No WebSocket, vai como `?token=`, só nessa rota.
  - A API libera CORS só para as origens do WebView (`https://localhost`, `capacitor://localhost`) e as aceita no Better Auth.
  - O endereço da API entra no build do app por `VITE_API_ORIGIN`.
- **Cronômetro no Android.** Plugin `StudyTimer` em Java, portado do módulo antigo:
  - um serviço em primeiro plano (`specialUse`) com a notificação do tempo correndo;
  - o botão "Pausar", que avisa o app pelo evento `pause`.
- **Avisos.** Notificações locais, sem servidor:
  - fim de bloco agendado no início ou na retomada do cronômetro;
  - lembretes de revisão às 8h nos próximos 14 dias.
- **Comportamento de app** (`platform/nativeShell.ts`):
  - botão voltar do Android;
  - deep links `meuedital://`;
  - toque em notificação abre a tela certa;
  - tela de abertura.
- **JDK.** Os plugins do Capacitor 8 compilam com Java 21. O Gradle baixa o JDK sozinho (resolver foojay em `settings.gradle`), e o Android Studio já traz o seu.
- **Builds e publicação são manuais**, pelo Android Studio e pelo Xcode, sem automação para as lojas.

**Pendências.**
- Login com Google pelo fluxo nativo de ID token, quando houver credenciais.
- Links universais (`https://.../...`), quando houver domínio.
- Live Activity no iOS.
- Teste de ponta a ponta no aparelho contra uma API publicada. Hoje está verificado só que o app compila e abre no emulador.

**Descartado.**
- React Native: reescreveria a interface.
- Preferences do Capacitor para o token: não é cifrado.
- Push remoto no app: as notificações locais cobrem o fim de bloco e as revisões sem servidor.
