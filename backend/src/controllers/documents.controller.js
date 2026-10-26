const service = require('../services/documents.service');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo no campo "file".' });
  }

  const document = service.create({
    originalName: req.file.originalname,
    size: req.file.size,
    filename: req.file.filename,
  });
  res.status(201).json(document);
}

function list(req, res) {
  res.json(service.list());
}

function download(req, res, next) {
  const record = service.findForDownload(req.params.id);

  if (!record) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  res.download(record.filePath, record.document.originalName, (error) => {
    if (!error) {
      return;
    }

    if (!res.headersSent && error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Arquivo do documento não encontrado.' });
    }

    next(error);
  });
}

module.exports = { upload, list, download };
