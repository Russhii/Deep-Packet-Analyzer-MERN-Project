import mongoose from 'mongoose';

const analysisReportSchema = new mongoose.Schema({
  captureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Capture', required: true },
  totalPackets: { type: Number, default: 0 },
  totalBytes: { type: Number, default: 0 },
  forwarded: { type: Number, default: 0 },
  dropped: { type: Number, default: 0 },
  tcpPackets: { type: Number, default: 0 },
  udpPackets: { type: Number, default: 0 },
  appBreakdown: [{ appType: String, count: Number, percentage: Number }],
  detectedDomains: [{ sni: String, appType: String }],
  durationMs: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AnalysisReport', analysisReportSchema);
