import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  type: { type: String, enum: ['ip', 'app', 'domain'], required: true },
  value: { type: String, required: true },
  description: { type: String },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Rule', ruleSchema);
