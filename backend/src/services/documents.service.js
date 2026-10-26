const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documents.repository');
const { defaultOwner } = require('../config');

function create(file) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: defaultOwner,
  };

  repository.save(document, file.filename);
  return document;
}

function list() {
  return repository.findAll().reverse().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function findForDownload(id) {
  return repository.findById(id);
}

module.exports = { create, list, findForDownload };
