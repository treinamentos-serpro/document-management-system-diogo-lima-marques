import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments, uploadDocument, downloadDocument } from '../src/services/api.js';

test('lista documentos via /api e encaminha o sinal de cancelamento', async (t) => {
  const documents = [{ id: '123', originalName: 'documento.txt' }];
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.signal, controller.signal);
    return Response.json(documents);
  });

  assert.deepEqual(await listDocuments({ signal: controller.signal }), documents);
});

test('envia o arquivo no campo file sem definir Content-Type manualmente', async (t) => {
  const file = new File(['conteúdo'], 'documento.txt', { type: 'text/plain' });
  const document = { id: '123', originalName: file.name };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined);
    assert.deepEqual([...options.body.keys()], ['file']);
    assert.equal(options.body.get('file').name, file.name);
    assert.equal(await options.body.get('file').text(), await file.text());
    return Response.json(document, { status: 201 });
  });

  assert.deepEqual(await uploadDocument(file), document);
});

test('baixa o conteúdo binário e codifica o identificador no caminho', async (t) => {
  const bytes = new Uint8Array([0, 1, 128, 255]);
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, '/api/documents/id%2Fespecial/download');
    return new Response(bytes);
  });

  const blob = await downloadDocument('id/especial');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
});

test('propaga as mensagens de erro JSON em todas as operações', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => (
    Response.json({ error: 'Erro informado pelo backend.' }, { status: 400 })
  ));

  for (const operation of [
    () => listDocuments(),
    () => uploadDocument(new File([''], 'vazio.txt')),
    () => downloadDocument('inexistente'),
  ]) {
    await assert.rejects(operation, { message: 'Erro informado pelo backend.' });
  }
});

test('informa o status HTTP quando o servidor não retorna um erro JSON', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => (
    new Response('<h1>Falha no proxy</h1>', { status: 502 })
  ));

  await assert.rejects(listDocuments, { message: 'A requisição falhou (HTTP 502).' });
});

test('informa erros de conexão em português', async (t) => {
  const cause = new TypeError('Failed to fetch');
  t.mock.method(globalThis, 'fetch', async () => { throw cause; });

  await assert.rejects(listDocuments, {
    message: 'Não foi possível conectar ao servidor.',
    cause,
  });
});

test('preserva o erro de cancelamento da requisição', async (t) => {
  const error = new DOMException('Operação cancelada.', 'AbortError');
  t.mock.method(globalThis, 'fetch', async () => { throw error; });

  await assert.rejects(listDocuments, (received) => received === error);
});
