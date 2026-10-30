import mongoose from 'mongoose';

const PartSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  title:     { type: String, required: true, trim: true },
  content:   { type: mongoose.Schema.Types.Mixed, default: null }, // TipTap JSON
  order:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Part || mongoose.model('Part', PartSchema);
