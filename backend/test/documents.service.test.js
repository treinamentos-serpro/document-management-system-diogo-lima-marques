const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('../src/services/documents.service');
const repository = require('../src/repositories/documents.repository');
const { defaultOwner } = require('../src/config');

test('cria metadados sem depender do formato do Multer', (t) => {
  const save = t.mock.method(repository, 'save', () => {});
  const input = { originalName: 'relatorio.txt', size: 42, filename: 'arquivo-fisico' };
  const before = Date.now();

  const document = service.create(input);

  assert.deepEqual(Object.keys(document).sort(),
    ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.match(document.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(document.originalName, input.originalName);
  assert.equal(document.size, input.size);
  assert.equal(document.owner, defaultOwner);
  const uploadedAt = Date.parse(document.uploadedAt);
  assert.ok(uploadedAt >= before && uploadedAt <= Date.now());
  assert.equal(new Date(uploadedAt).toISOString(), document.uploadedAt);
  assert.equal(save.mock.callCount(), 1);
  assert.deepEqual(save.mock.calls[0].arguments, [document, input.filename]);
  assert.deepEqual(input, { originalName: 'relatorio.txt', size: 42, filename: 'arquivo-fisico' });
});

test('gera identificadores distintos para arquivos com o mesmo nome', (t) => {
  t.mock.method(repository, 'save', () => {});
  const input = { originalName: 'relatorio.txt', size: 0, filename: 'primeiro' };

  const first = service.create(input);
  const second = service.create({ ...input, filename: 'segundo' });

  assert.notEqual(first.id, second.id);
  assert.equal(first.size, 0);
  assert.equal(second.originalName, first.originalName);
});

test('propaga erros de persistencia sem retornar sucesso', (t) => {
  const error = new Error('Falha na persistencia');
  t.mock.method(repository, 'save', () => { throw error; });

  assert.throws(() => service.create({
    originalName: 'relatorio.txt',
    size: 42,
    filename: 'arquivo-fisico',
  }), (received) => received === error);
});

test('lista documentos por data e desempata pela insercao mais recente', (t) => {
  const first = { id: 'primeiro', uploadedAt: '2026-01-02T00:00:00.000Z' };
  const older = { id: 'antigo', uploadedAt: '2026-01-01T00:00:00.000Z' };
  const last = { id: 'ultimo', uploadedAt: first.uploadedAt };
  const findAll = t.mock.method(repository, 'findAll', () => [first, older, last]);

  assert.deepEqual(service.list(), [last, first, older]);
  assert.equal(findAll.mock.callCount(), 1);
});

test('lista vazia permanece vazia', (t) => {
  t.mock.method(repository, 'findAll', () => []);

  assert.deepEqual(service.list(), []);
});

test('consulta download pelo identificador sem transformar o registro', (t) => {
  const record = { document: { id: 'documento' }, filePath: '/storage/arquivo' };
  const findById = t.mock.method(repository, 'findById', () => record);

  assert.equal(service.findForDownload('documento'), record);
  assert.deepEqual(findById.mock.calls[0].arguments, ['documento']);
});

test('preserva ausencia de documento no download', (t) => {
  t.mock.method(repository, 'findById', () => undefined);

  assert.equal(service.findForDownload('inexistente'), undefined);
});
