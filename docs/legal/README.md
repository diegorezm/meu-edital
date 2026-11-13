# Documentos legais

**Minutas: precisam de revisão por advogado antes de valerem em produção.** Os trechos entre `[colchetes]` precisam ser preenchidos.

- [termos.md](termos.md): Termos de Uso
- [privacidade.md](privacidade.md): Política de Privacidade

Para publicar uma versão nova:
1. Edite o texto e atualize a data no topo.
2. Acrescente a versão em `apps/api/src/legal/documents.ts`, com `material: true` se a mudança afetar direitos, finalidades, dados coletados ou terceiros. Nesse caso, todos aceitam de novo no próximo acesso.
3. Escreva um `summary` curto: é o que aparece no modal de re-aceite.

Não apague versões antigas da lista; o histórico de aceites aponta para elas.
