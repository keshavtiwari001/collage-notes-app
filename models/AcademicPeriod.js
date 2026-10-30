import mongoose from 'mongoose';

const AcademicPeriodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:   { type: String, required: true, trim: true },
  type:   { type: String, enum: ['semester', 'year'], default: 'semester' },
  order:  { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.AcademicPeriod || mongoose.model('AcademicPeriod', AcademicPeriodSchema);
