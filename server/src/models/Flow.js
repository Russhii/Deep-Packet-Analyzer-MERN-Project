import mongoose from 'mongoose';

const flowSchema = new mongoose.Schema({
  captureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Capture', required: true },
  fiveTuple: {
    srcIp: String,
    dstIp: String,
    srcPort: Number,
    dstPort: Number,
    protocol: Number,
  },
  appType: { type: String, default: 'UNKNOWN' },
  sni: { type: String },
  packetsIn: { type: Number, default: 0 },
  packetsOut: { type: Number, default: 0 },
  bytesIn: { type: Number, default: 0 },
  bytesOut: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false },
  firstSeen: Date,
  lastSeen: Date,
}, { timestamps: true });

flowSchema.index({ captureId: 1 });
flowSchema.index({ captureId: 1, 'fiveTuple.srcIp': 1, 'fiveTuple.dstIp': 1, 'fiveTuple.srcPort': 1, 'fiveTuple.dstPort': 1 });

export default mongoose.model('Flow', flowSchema);
