const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

process.env.UPLOAD_MAX_SIZE_BYTES = '1024';
process.env.DMS_DEFAULT_OWNER = 'test-user';

const app = require('../src/app');
const repository = require('../src/repositories/documents.repository');
const { storageDirectory } = require('../src/config');

test('configuração define padrões e rejeita limites inválidos', () => {
  function readConfig(value) {
    return spawnSync(process.execPath, [
      '-e', 'process.stdout.write(JSON.stringify(require("./src/config")))',
    ], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, UPLOAD_MAX_SIZE_BYTES: value, DMS_DEFAULT_OWNER: '' },
      encoding: 'utf8',
    });
  }

  const defaults = readConfig('');
  assert.equal(defaults.status, 0);
  const config = JSON.parse(defaults.stdout);
  assert.equal(config.uploadMaxSizeBytes, 10 * 1024 * 1024);
  assert.equal(config.defaultOwner, 'local-user');

  for (const value of ['0', '-1', '1.5', 'abc', 'Infinity']) {
    const result = readConfig(value);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /UPLOAD_MAX_SIZE_BYTES deve ser um inteiro positivo/);
  }
});

test('API de documentos com armazenamento local', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function sendFile(content, filename = 'documento.txt', field = 'file') {
    const form = new FormData();
    form.append(field, new Blob([content]), filename);
    return fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  }

  function trackFile(document) {
    const record = repository.findById(document.id);
    t.after(() => fs.promises.rm(record.filePath, { force: true }));
    return record.filePath;
  }

  async function expectError(response, status) {
    assert.equal(response.status, status);
    const body = await response.json();
    assert.deepEqual(Object.keys(body), ['error']);
    assert.equal(typeof body.error, 'string');
    assert.ok(body.error.length > 0);
  }

  await t.test('preserva a verificação de saúde', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  await t.test('lista vazia antes do primeiro upload', async () => {
    const response = await fetch(`${baseUrl}/documents`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });

  let firstDocument;
  await t.test('salva metadados e bytes no disco sem usar o nome original no caminho', async () => {
    const content = Buffer.from([0, 1, 2, 128, 255]);
    const response = await sendFile(content, 'relatorio.bin');
    assert.equal(response.status, 201);
    firstDocument = await response.json();
    const filePath = trackFile(firstDocument);

    assert.deepEqual(Object.keys(firstDocument).sort(),
      ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
    assert.match(firstDocument.id, /^[0-9a-f-]{36}$/);
    assert.equal(firstDocument.originalName, 'relatorio.bin');
    assert.equal(firstDocument.size, content.length);
    assert.equal(firstDocument.owner, 'test-user');
    assert.equal(new Date(firstDocument.uploadedAt).toISOString(), firstDocument.uploadedAt);
    assert.equal(path.dirname(filePath), storageDirectory);
    assert.notEqual(path.basename(filePath), firstDocument.originalName);
    assert.deepEqual(await fs.promises.readFile(filePath), content);

    const download = await fetch(`${baseUrl}/documents/${firstDocument.id}/download`);
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-disposition'), /attachment; filename="relatorio.bin"/);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), content);
  });

  await t.test('preserva uploads com nomes repetidos e ordena a listagem', async () => {
    const response = await sendFile('novo conteúdo', 'relatorio.bin');
    assert.equal(response.status, 201);
    const secondDocument = await response.json();
    const secondPath = trackFile(secondDocument);
    assert.notEqual(secondDocument.id, firstDocument.id);
    assert.notEqual(secondPath, repository.findById(firstDocument.id).filePath);

    const listing = await fetch(`${baseUrl}/documents`);
    assert.equal(listing.status, 200);
    assert.deepEqual(await listing.json(), [secondDocument, firstDocument]);
  });

  await t.test('aceita arquivo exatamente no limite configurado', async () => {
    const response = await sendFile(Buffer.alloc(1024));
    assert.equal(response.status, 201);
    const document = await response.json();
    trackFile(document);
    assert.equal(document.size, 1024);
  });

  await t.test('rejeita uploads inválidos sem deixar arquivos ou metadados extras', async () => {
    const filesBefore = (await fs.promises.readdir(storageDirectory)).sort();
    const documentsBefore = repository.findAll();

    await expectError(await fetch(`${baseUrl}/upload`, { method: 'POST' }), 400);
    await expectError(await sendFile('conteúdo', 'arquivo.txt', 'wrong'), 400);
    await expectError(await sendFile(Buffer.alloc(1025)), 413);

    const form = new FormData();
    form.append('file', new Blob(['primeiro']), 'um.txt');
    form.append('file', new Blob(['segundo']), 'dois.txt');
    await expectError(await fetch(`${baseUrl}/upload`, { method: 'POST', body: form }), 400);
    await expectError(await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: 'sem boundary',
    }), 400);

    assert.deepEqual(repository.findAll(), documentsBefore);
    assert.deepEqual((await fs.promises.readdir(storageDirectory)).sort(), filesBefore);
  });

  await t.test('retorna 404 para documento inexistente e arquivo removido', async () => {
    await expectError(await fetch(`${baseUrl}/documents/inexistente/download`), 404);
    const response = await sendFile('remover');
    assert.equal(response.status, 201);
    const document = await response.json();
    const filePath = trackFile(document);
    await fs.promises.unlink(filePath);
    await expectError(await fetch(`${baseUrl}/documents/${document.id}/download`), 404);
  });

  await t.test('reporta falhas de escrita sem expor detalhes internos', async (t) => {
    const error = Object.assign(new Error('detalhe interno de escrita'), { code: 'EACCES' });
    t.mock.method(fs, 'mkdir', (directory, options, callback) => callback(error));
    const log = t.mock.method(console, 'error', () => {});
    const countBefore = repository.findAll().length;

    const response = await sendFile('conteúdo');
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Erro interno ao processar a requisição.' });
    assert.equal(log.mock.callCount(), 1);
    assert.equal(repository.findAll().length, countBefore);
  });
});
