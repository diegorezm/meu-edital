# Meu Edital

App de **estudo cíclico para concursos públicos**, com cara de RPG de gestão aconchegante. Ele transforma o edital em matérias e assuntos, monta um ciclo de estudos pelos pesos de cada matéria e acompanha o que foi estudado na semana.

O app responde a duas perguntas:

- **O que eu estudo agora?** O próximo bloco da jornada, com um assunto sugerido.
- **Como foi minha semana?** O tempo estudado contra a meta, por matéria e por dia.

> Agentes de código: este arquivo explica **o que** o app é. Para **como** trabalhar no código, leia [AGENTS.md](AGENTS.md).

## Estado

Reconstrução em andamento, em fases: [docs/prompt-reconstrucao.md](docs/prompt-reconstrucao.md).

A fase 1 (fundação) está pronta:
- monorepo;
- domínio e contexto de IA portados com testes;
- schema do D1;
- Worker com auth completo;
- telas de conta;
- workflows de CI escritos.

## Como o estudo funciona

| Conceito | No app | O que é |
| --- | --- | --- |
| Concurso | Campanha | Nome, cargo, banca, data da prova e meta de horas por semana. Vários concursos, um ativo. |
| Matéria | Atributo | Disciplina do edital. Peso = `questões × pontos por questão`, um peso informado ou 1. |
| Assunto | — | Item do conteúdo programático, com subassuntos. Fica estudado quando tem uma sessão. |
| Ciclo | Jornada | Fila de blocos (matéria + minutos). Uma volta soma a meta semanal. Faltou um dia, a jornada espera. |
| Sessão | — | Registro de estudo: tipo (Teoria, Questões ou Revisão), minutos, questões, acertos e anotação. Pode ser corrigida ou excluída. |
| Revisão | — | Agendada no primeiro estudo de cada assunto (1, 7 e 30 dias). |
| Semana | — | De segunda a domingo, comparada com a meta salva no início da semana. |

## Tecnologia

Cloudflare Workers, D1, Durable Objects e R2. API em Hono, banco com Drizzle e auth com Better Auth. App em React 19, Vite, TanStack Router e Tailwind CSS v4. Monorepo com Bun e Turborepo, e testes com Vitest. Detalhes em [docs/decisions/](docs/decisions/README.md).

## Executar

Requer Bun 1.4+ e Node 22+.

```bash
bun install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # e preencha BETTER_AUTH_SECRET
bun run dev     # http://localhost:5173 (aplica as migrações locais ao subir)
```

Sem domínio de e-mail configurado, os links de confirmação e de recuperação de senha aparecem no log do Worker.

## Licença

Distribuído sob a [GNU GPL versão 3](LICENSE) (`GPL-3.0-only`).
