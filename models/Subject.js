import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  periodId:    { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicPeriod', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  color:       { type: String, default: '#3b6ef6' },
  icon:        { type: String, default: 'BookOpen' },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
