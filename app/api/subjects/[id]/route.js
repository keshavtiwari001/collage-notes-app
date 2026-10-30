import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest, notFound } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
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
    if (mongoId(id)) return notFound('Subject');
    await connectDB();
    const subject = await Subject.findOne({ _id: id, userId: session.userId });
    if (!subject) return notFound('Subject');
    return success(subject);
  } catch (err) { return error(err.message); }
});

export const PUT = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Subject');
    const { name, description, color } = await req.json();
    const cleanName = sanitize(name);
    const cleanDesc = sanitize(description);
    const err = validate(required(cleanName, 'Name'), maxLength(cleanName, 120, 'Name'), maxLength(cleanDesc, 500, 'Description'));
    if (err) return badRequest(err);
    await connectDB();
    const subject = await Subject.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { name: cleanName, description: cleanDesc || '', color: color || '#3b6ef6' },
      { new: true }
    );
    if (!subject) return notFound('Subject');
    return success(subject);
  } catch (err) { return error(err.message); }
});

export const DELETE = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Subject');
    await connectDB();
    const subject = await Subject.findOneAndDelete({ _id: id, userId: session.userId });
    if (!subject) return notFound('Subject');
    const chapters   = await Chapter.find({ subjectId: id }).lean();
    const chapterIds = chapters.map(c => c._id);
    await Part.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ subjectId: id });
    await QA.deleteMany({ subjectId: id });
    return success({ success: true });
  } catch (err) { return error(err.message); }
});
