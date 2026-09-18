import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classify } from './classifier.js';

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ACCEPTED.has(file.mimetype)) {
      cb(new Error('That file type will not go through. Use a JPEG, PNG, GIF or WebP.'));
      return;
    }
    cb(null, true);
  },
});

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(here, 'public')));

app.post('/api/classify', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No photo arrived. Pick a file and send it again.' });
    return;
  }
  try {
    const result = await classify(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    console.error('[classify]', error);
    res.status(502).json({ error: error.message });
  }
});

// multer and fileFilter errors land here.
app.use((error, _req, res, _next) => {
  const message = error?.code === 'LIMIT_FILE_SIZE'
    ? 'That photo is over 8 MB. Use a smaller one.'
    : error?.message || 'Something broke on the way in.';
  res.status(400).json({ error: message });
});

const port = Number(process.env.PORT) || 3457;
app.listen(port, () => {
  console.log(`Dog or Not Hotdog → http://localhost:${port}`);
});
