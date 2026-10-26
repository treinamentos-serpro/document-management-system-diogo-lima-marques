# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey diogolimamarques!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-diogo-lima-marques/issues/1)

---

## Backend local

```bash
cd backend
npm install
npm start
```

O backend escuta em `http://localhost:3000` por padrão. Configuração opcional:

- `PORT`: porta HTTP (padrão `3000`).
- `UPLOAD_MAX_SIZE_BYTES`: inteiro positivo com o limite por arquivo em bytes
  (padrão `10485760`, equivalente a 10 MiB).
- `DMS_DEFAULT_OWNER`: dono dos documentos (padrão `local-user`). O MVP não
  implementa autenticação nem isolamento entre usuários.

### API

- `GET /health`: retorna `200` com `{ "status": "ok" }`.
- `POST /upload`: recebe `multipart/form-data` com um único arquivo no campo
  `file`, de qualquer tipo. Retorna `201` com `id`, `originalName`, `size` em
  bytes, `uploadedAt` em ISO 8601 e `owner`.
- `GET /documents`: retorna `200` com um array desses metadados, do mais recente
  para o mais antigo, sem paginação.
- `GET /documents/:id/download`: retorna `200` com o conteúdo binário e
  `Content-Disposition: attachment`, preservando o nome original.

Erros retornam JSON no formato `{ "error": "mensagem" }`: `400` para upload sem
arquivo, campo incorreto ou multipart inválido, `413` para tamanho excedido,
`404` para documento ou arquivo inexistente e `500` para falhas internas.

```bash
curl -F "file=@./documento.pdf" http://localhost:3000/upload
curl http://localhost:3000/documents
curl -OJ http://localhost:3000/documents/ID_RETORNADO/download
```

Arquivos são gravados exclusivamente em `backend/storage` via Multer
`diskStorage`, com nomes físicos gerados pela aplicação. Os metadados ficam em
memória: reiniciar o processo esvazia a listagem, mas não apaga os arquivos já
gravados. O frontend usa o prefixo `/api`, removido pelo proxy do Vite.

Para executar os testes do backend: `cd backend && npm test`.

### Responsabilidades do backend

O fluxo segue `routes -> controllers -> services -> repositories`. O controller
adapta o arquivo do Multer para a entrada do serviço (`originalName`, `size` e
`filename`), sem expor o formato da biblioteca às regras de negócio. O serviço
separa a criação dos metadados da coordenação de sua persistência; o repository
mantém os registros em memória e resolve os caminhos físicos dos arquivos.
A listagem preserva os documentos mais recentes primeiro; em datas iguais, o
último inserido vem primeiro.

## Frontend

Com o backend em execução, inicie o frontend em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. A interface permite enviar um arquivo, listar
seus metadados e baixá-lo com o nome original. A lista é atualizada após cada
upload e também pelo botão **Atualizar lista**. Falhas são exibidas na interface,
com uma nova tentativa disponível.

O cliente em `frontend/src/services/api.js` centraliza as chamadas `fetch` via
`/api`; o proxy de desenvolvimento do Vite encaminha essas chamadas ao backend
em `http://localhost:3000`. Em produção, configure o servidor para encaminhar
`/api` ao backend, removendo esse prefixo.

Para gerar o build: `cd frontend && npm run build`.
Para testar o cliente de API: `cd frontend && node --test`.

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)
