import mongoose from 'mongoose';

const QASchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  question:  { type: String, required: true, trim: true },
  answer:    { type: mongoose.Schema.Types.Mixed, default: null }, // TipTap JSON or plain string
  order:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.QA || mongoose.model('QA', QASchema);
