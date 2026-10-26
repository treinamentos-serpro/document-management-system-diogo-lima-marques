const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = status === 413
      ? 'O arquivo excede o limite de tamanho permitido.'
      : 'Envie apenas um arquivo no campo "file".';
    return res.status(status).json({ error: message });
  }

  if (error.status === 400) {
    return res.status(400).json({ error: 'Requisição inválida.' });
  }

  console.error('Erro ao processar requisição:', error);
  res.status(500).json({ error: 'Erro interno ao processar a requisição.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
