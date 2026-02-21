import express from 'express';
import Rule from '../models/Rule.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 }).lean();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, value, description } = req.body;
    if (!type || !value) return res.status(400).json({ error: 'type and value required' });
    if (!['ip', 'app', 'domain'].includes(type)) return res.status(400).json({ error: 'type must be ip, app, or domain' });
    const rule = new Rule({ type, value: String(value).trim(), description });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
