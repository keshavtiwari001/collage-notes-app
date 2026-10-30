import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest, notFound } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import AcademicPeriod from '@/models/AcademicPeriod';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Part from '@/models/Part';
import QA from '@/models/QA';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Period');
    await connectDB();
    // Scope by both _id AND userId — prevents reading another user's period
    const period = await AcademicPeriod.findOne({ _id: id, userId: session.userId });
    if (!period) return notFound('Period');
    return success(period);
  } catch (err) { return error(err.message); }
});

export const PUT = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Period');
    const { name, type } = await req.json();
    const clean = sanitize(name);
    const err = validate(required(clean, 'Name'), maxLength(clean, 100, 'Name'));
    if (err) return badRequest(err);
    await connectDB();
    const period = await AcademicPeriod.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { name: clean, type: type || 'semester' },
      { new: true }
    );
    if (!period) return notFound('Period');
    return success(period);
  } catch (err) { return error(err.message); }
});

export const DELETE = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Period');
    await connectDB();
    // Only delete if owned by this user
    const period = await AcademicPeriod.findOneAndDelete({ _id: id, userId: session.userId });
    if (!period) return notFound('Period');
    // Cascade by IDs derived from the owned period (safe — IDs come from our own DB lookup)
    const subjects   = await Subject.find({ periodId: id }).lean();
    const subjectIds = subjects.map(s => s._id);
    const chapters   = await Chapter.find({ subjectId: { $in: subjectIds } }).lean();
    const chapterIds = chapters.map(c => c._id);
    await Part.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ subjectId: { $in: subjectIds } });
    await QA.deleteMany({ subjectId: { $in: subjectIds } });
    await Subject.deleteMany({ periodId: id });
    return success({ success: true });
  } catch (err) { return error(err.message); }
});
