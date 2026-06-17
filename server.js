// server.js — Olai Notes production server for Hostinger Node.js hosting
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

// Safety check — make sure the build exists
if (!existsSync(DIST)) {
  console.error('❌  dist/ folder not found. Run: npm run build');
  process.exit(1);
}

// Serve static assets with long cache
app.use(
  '/assets',
  express.static(join(DIST, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve everything else in dist (favicon, etc.)
app.use(express.static(DIST, { maxAge: '1h' }));

// SPA fallback — all routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✦ Olai Notes running on port ${PORT}`);
});
