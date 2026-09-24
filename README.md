# Meu Edital

O **Meu Edital** é um aplicativo de organização de estudos para concursos públicos. Sua função é transformar o conteúdo de um edital em matérias, assuntos e ações concretas de estudo, respondendo com clareza à pergunta: **“O que preciso estudar agora?”**

## Filosofia do produto

**A IA externa interpreta e sugere; o aplicativo organiza, registra e acompanha.** Nesta versão, o usuário copia um prompt gerado pelo app, envia o edital ou seus dados de estudo ao ChatGPT, Gemini, Claude, NotebookLM ou outra ferramenta e cola a resposta de volta. O app valida o JSON, mostra uma prévia e só importa após confirmação. Nenhum edital é enviado automaticamente e nenhuma API de IA é integrada. O conteúdo importado é tratado como dado não confiável, nunca como código.

A experiência deve ser simples, rápida e focada em produtividade: próximo estudo em destaque, interface limpa, boa leitura em celular e desktop, tema escuro e pouca animação. Na dúvida, preferimos a solução mais simples que atende bem ao estudante.

## O que o MVP oferece

- Vários concursos, cada um com matérias, assuntos e subassuntos.
- Dashboard com próximo estudo, progresso, revisões e resumo da semana.
- Sessões com timer, duração, questões, acertos e observações.
- Plano semanal, ciclo de estudos e revisões automáticas configuráveis (1, 7 e 30 dias por padrão).
- Importação de edital e de plano semanal por respostas estruturadas de IA externa.
- Dados de demonstração do concurso DETRAN-SP no primeiro uso.

## Estrutura técnica

Expo SDK 57, React Native, Expo Router e TypeScript. As telas ficam em `src/app`; entidades e regras em `src/domain`; persistência local em `src/data`; schemas, importadores e prompts em `src/interchange`. A interface `AIProvider` possui apenas o `ExternalCopyPasteProvider` hoje e permite acrescentar provedores de API no futuro. Os dados são salvos localmente com AsyncStorage; não há conta nem sincronização entre dispositivos.

## Executar e verificar

Requer Node.js 22.13+ e npm.

```bash
npm install
npx expo start
```

### Android sem fila do EAS

Para criar e instalar o development build diretamente no emulador Android, com o Android SDK configurado no computador:

```bash
npm run android:build
```

Depois da primeira instalação, use `npm run android` para abrir o app no emulador. Para um celular físico que já tenha o development build instalado, execute `npm start` e leia o QR code com o celular. Alterações em JavaScript e TypeScript são carregadas pelo Metro sem repetir o build nativo. Execute `npm run android:build` novamente quando mudar dependências nativas ou a configuração nativa do app.

```bash
npx expo lint
npx tsc --noEmit
npm test
```

O escopo desta versão não inclui pagamentos, recursos sociais, gamificação complexa, notificações push ou APIs pagas de IA.

## Licença

O código do Meu Edital é distribuído sob a [GNU GPL versão 3](LICENSE) (`GPL-3.0-only`). Quem distribuir uma versão que incorpore ou modifique esse código deve disponibilizar o código-fonte correspondente sob a mesma licença. O aviso de licença dos arquivos provenientes do template da Expo está preservado em [LICENSES/Expo-template-MIT.txt](LICENSES/Expo-template-MIT.txt). As dependências mantêm suas próprias licenças.
