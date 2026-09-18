import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classify, ACCEPTED, MAX_BYTES } from './classifier.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

// The browser posts the image bytes raw with the file's type as Content-Type,
// so there is no multipart form to parse.
app.use(express.raw({ type: 'image/*', limit: MAX_BYTES }));

app.post('/api/classify', async (req, res) => {
  const mediaType = (req.get('content-type') || '').split(';')[0].trim();
  if (!ACCEPTED.has(mediaType)) {
    res.status(415).json({ error: 'That file type will not go through. Use a JPEG, PNG, GIF or WebP.' });
    return;
  }
  if (!req.body?.length) {
    res.status(400).json({ error: 'No photo arrived. Pick a file and send it again.' });
    return;
  }

  try {
    res.json(await classify(req.body, mediaType));
  } catch (error) {
    console.error('[classify]', error);
    res.status(502).json({ error: error.message });
  }
});

app.use(express.static(path.join(here, 'public')));

app.use((error, _req, res, _next) => {
  const message = error?.type === 'entity.too.large'
    ? 'That photo is too large. Use a smaller one.'
    : error?.message || 'Something broke on the way in.';
  res.status(400).json({ error: message });
});

const port = Number(process.env.PORT) || 3457;
app.listen(port, () => console.log(`SeeFood → http://localhost:${port}`));
