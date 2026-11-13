# App mobile (Capacitor)

Casca nativa em torno do build de `apps/web`. A interface e as regras são as mesmas da web; o que muda fica em `apps/web/src/platform/native.ts` e no plugin Android `StudyTimer` (`android/app/src/main/java/app/meuedital/`).

## Gerar e abrir

O app precisa saber o endereço da API, que entra no build da web:

```bash
# na raiz do repositório
VITE_API_ORIGIN=https://<endereco-da-api> bun run --cwd apps/web build
bun run --cwd apps/mobile sync      # copia o build e os plugins para android/
bun run --cwd apps/mobile android   # abre no Android Studio
```

No Android Studio: Run para testar no emulador ou no aparelho; Build > Generate Signed Bundle para a Play Store. Builds e publicação são manuais.

Para compilar pela linha de comando, o Gradle precisa rodar com Java 21 (o Android Studio já traz um):

```bash
cd apps/mobile/android
JAVA_HOME=<jdk-21> ./gradlew assembleDebug
```

## iOS

Precisa de um Mac com Xcode: `bunx cap add ios` dentro de `apps/mobile` e depois `bun run --cwd apps/mobile ios`.
