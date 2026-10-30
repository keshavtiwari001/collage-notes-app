import mongoose from 'mongoose';

const ChapterSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title:     { type: String, required: true, trim: true },
  content:   { type: mongoose.Schema.Types.Mixed, default: null }, // Direct content if no parts
  order:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
