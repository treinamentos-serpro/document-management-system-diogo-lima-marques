const path = require('node:path');
const { storageDirectory } = require('../config');

const documents = new Map();

function save(document, filename) {
  documents.set(document.id, { document, filename });
}

function findAll() {
  return Array.from(documents.values(), (record) => record.document);
}

function findById(id) {
  const record = documents.get(id);
  if (!record) {
    return undefined;
  }

  return {
    document: record.document,
    filePath: path.join(storageDirectory, record.filename),
  };
}

module.exports = { save, findAll, findById };
