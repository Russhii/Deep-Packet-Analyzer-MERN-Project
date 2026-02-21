import express from 'express';
import Flow from '../models/Flow.js';
import AnalysisReport from '../models/AnalysisReport.js';

const router = express.Router();

router.get('/report/:captureId', async (req, res) => {
  try {
    const report = await AnalysisReport.findOne({ captureId: req.params.captureId }).sort({ createdAt: -1 }).lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/flows/:captureId', async (req, res) => {
  try {
    const flows = await Flow.find({ captureId: req.params.captureId })
      .sort({ lastSeen: -1 })
      .limit(500)
      .lean();
    res.json(flows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
