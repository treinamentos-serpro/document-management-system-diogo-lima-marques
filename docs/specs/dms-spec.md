## Plano: Especificação do DMS

Criar somente `docs/specs/dms-spec.md`, seguindo as oito seções de `docs/specs/spec-template.md`. O documento consolidará o MVP previsto sem confundir requisitos futuros com o scaffold atual, definirá contratos de API verificáveis e organizará a implementação futura em etapas. Nenhum arquivo de backend ou frontend será executado ou alterado nesta tarefa.

**Etapas**
1. Usar o template como estrutura e preservar seus requisitos-base, detalhando critérios observáveis para upload, listagem e download.
2. Documentar o modelo de metadados: `id`, `originalName`, `size` em bytes, `uploadedAt` ISO 8601 e `owner`. Explicitar que arquivos são locais e metadados ficam em memória, sem sobrevivência dos registros a reinícios nesta fase.
3. Especificar os três contratos REST: `POST /upload` com `multipart/form-data`, campo `file`, status `201` e metadados; `GET /documents` com status `200` e coleção; `GET /documents/:id/download` com conteúdo binário e `Content-Disposition`. Detalhar status e formato de erro para entrada inválida, tamanho excedido, documento inexistente e falha interna. Explicar que o frontend chama com prefixo `/api`, removido pelo proxy Vite antes de encaminhar ao backend.
4. Registrar decisões do MVP: sem autenticação/cadastro; owner singleton configurado pelo ambiente (recomendação: `DMS_DEFAULT_OWNER`, padrão `local-user`); aceitar qualquer tipo de arquivo; limite configurável (recomendação: `UPLOAD_MAX_SIZE_BYTES`, padrão 10 MiB); ID único gerado pelo sistema; nome físico controlado pela aplicação, sem usar o nome original para formar caminho; listagem sem paginação, ordenada do mais recente para o mais antigo. Tratar respostas JSON e erros como contratos normativos, sem lacunas.
5. Fixar arquitetura e limites: `routes -> controllers -> services -> repositories`; arquivos em `backend/storage` com Multer `diskStorage`; metadados em memória; nenhuma dependência de armazenamento externo/nuvem. Gestão de múltiplos usuários autenticados, versionamento e persistência durável de metadados ficam fora do MVP.
6. Incluir no documento um plano de execução futuro com etapas dependentes: backend/storage e regras de negócio; testes de contratos e falhas; frontend com upload/listagem/download; integração e validação. Cada etapa terá resultado/critério de conclusão. Isso descreve trabalho posterior e não autoriza implementá-lo nesta tarefa.
7. Revisar a especificação contra o template, instruções e código existente; sinalizar que hoje só há `/health` e que os fluxos de documentos são previstos, ainda não implementados.

**Arquivos relevantes**
- `docs/specs/spec-template.md` — estrutura e requisitos-base.
- `.github/copilot-instructions.md` — arquitetura, endpoints previstos, armazenamento e convenções.
- `backend/src/app.js` e `backend/test/app.test.js` — estado atual do backend e cobertura existente.
- `frontend/vite.config.js`, `frontend/src/App.jsx` e `frontend/src/main.jsx` — proxy e scaffold atual.
- `backend/package.json` e `frontend/package.json` — dependências/comandos disponíveis para as fases futuras.
- `docs/specs/dms-spec.md` — único arquivo a criar nesta tarefa.

**Verificação**
1. Confirmar as oito seções do template, RF/RNF, critérios funcionais, modelo de dados, três contratos e plano futuro por fases.
2. Verificar em cada endpoint método, caminho, entrada, resposta/status e erros relevantes, incluindo compatibilidade com o proxy `/api`.
3. Conferir coerência com Clean Architecture simples e com Multer `diskStorage` em `backend/storage`; excluir armazenamento remoto e autenticação do MVP.
4. Conferir que o diff contém apenas `docs/specs/dms-spec.md`. Testes de aplicação não são necessários porque nenhum código será alterado.

**Decisões**
- Entrega atual somente documental: criar `docs/specs/dms-spec.md`; não editar nem executar implementação dos arquivos de backend/frontend.
- O plano dentro da spec cobre implementação funcional posterior em backend e frontend, sem executar essas etapas agora.
- Respostas do usuário: sem autenticação no MVP e sem restrição por tipo de arquivo.
- Detalhamento recomendado: owner singleton por variável de ambiente, limite de upload configurável com default de 10 MiB, respostas JSON normativas, sem paginação e armazenamento local/volátil. O valor default é uma decisão de especificação proposta para o MVP, não um requisito já implementado.
- A implementação atual contém apenas `GET /health`; os requisitos de documentos são planejados.
