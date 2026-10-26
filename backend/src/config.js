const path = require('node:path');

const uploadMaxSizeBytes = Number(process.env.UPLOAD_MAX_SIZE_BYTES || 10 * 1024 * 1024);

if (!Number.isSafeInteger(uploadMaxSizeBytes) || uploadMaxSizeBytes <= 0) {
  throw new Error('UPLOAD_MAX_SIZE_BYTES deve ser um inteiro positivo em bytes.');
}

module.exports = {
  storageDirectory: path.resolve(__dirname, '../storage'),
  uploadMaxSizeBytes,
  defaultOwner: process.env.DMS_DEFAULT_OWNER || 'local-user',
};
