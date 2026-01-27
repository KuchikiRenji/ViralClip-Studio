import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0');

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
