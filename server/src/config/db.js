import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/packet_analyzer';

export async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
}
