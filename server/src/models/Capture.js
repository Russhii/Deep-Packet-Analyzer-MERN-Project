import mongoose from 'mongoose';

const captureSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, default: 0 },
  packetCount: { type: Number, default: 0 },
  status: { type: String, enum: ['uploaded', 'analyzing', 'done', 'error'], default: 'uploaded' },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Capture', captureSchema);
