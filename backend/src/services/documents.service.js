const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documents.repository');
const { defaultOwner } = require('../config');

function createMetadata({ originalName, size }) {
  return {
    id: randomUUID(),
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner: defaultOwner,
  };
}

function create({ originalName, size, filename }) {
  const document = createMetadata({ originalName, size });
  repository.save(document, filename);
  return document;
}

function list() {
  // Em datas iguais, o documento inserido por último continua vindo primeiro.
  return repository.findAll().reverse().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function findForDownload(id) {
  return repository.findById(id);
}

module.exports = { create, list, findForDownload };
