import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Capture from '../models/Capture.js';
import { runAnalysis } from '../services/analysisService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const captures = await Capture.find().sort({ createdAt: -1 }).lean();
    res.json(captures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const capture = await Capture.findById(req.params.id).lean();
    if (!capture) return res.status(404).json({ error: 'Capture not found' });
    res.json(capture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('pcap'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const capture = new Capture({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      status: 'uploaded',
    });
    await capture.save();
    res.status(201).json(capture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const capture = await Capture.findById(req.params.id);
    if (!capture) return res.status(404).json({ error: 'Capture not found' });
    const filePath = path.join(uploadDir, capture.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });
    runAnalysis(req.params.id, filePath)
      .then((result) => res.json(result))
      .catch((err) => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
