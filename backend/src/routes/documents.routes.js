const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const controller = require('../controllers/documents.controller');
const { storageDirectory, uploadMaxSizeBytes } = require('../config');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  // O Busboy emite LIMIT_FILE_SIZE ao atingir o limite, não apenas ao excedê-lo.
  limits: { fileSize: uploadMaxSizeBytes + 1, files: 1 },
});

const router = express.Router();

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    // Erros de parsing multipart do Busboy não possuem código; erros de I/O possuem.
    if (error && !error.code) {
      error.status = 400;
    }
    next(error);
  });
}, controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
