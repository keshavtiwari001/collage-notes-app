import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get('periodId');
    if (!periodId || mongoId(periodId)) return badRequest('Valid periodId is required');
    await connectDB();
    // Double-scope: periodId AND userId
    const subjects = await Subject.find({ periodId, userId: session.userId }).sort({ order: 1, createdAt: 1 });
    const counts   = await Chapter.aggregate([
      { $match: { subjectId: { $in: subjects.map(s => s._id) }, userId: session.userId } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    return success(subjects.map(s => ({ ...s.toObject(), chapterCount: countMap[s._id.toString()] || 0 })));
  } catch (err) { return error(err.message); }
});

export const POST = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { periodId, name, description, color } = await req.json();
    const cleanName = sanitize(name);
    const cleanDesc = sanitize(description);
    const err = validate(
      mongoId(periodId, 'periodId') ? 'Valid periodId is required' : null,
      required(cleanName, 'Name'),
      maxLength(cleanName, 120, 'Name'),
      maxLength(cleanDesc, 500, 'Description'),
    );
    if (err) return badRequest(err);
    await connectDB();
    const count   = await Subject.countDocuments({ periodId, userId: session.userId });
    const subject = await Subject.create({
      userId: session.userId, periodId,
      name: cleanName, description: cleanDesc || '', color: color || '#3b6ef6', order: count,
    });
    return success({ ...subject.toObject(), chapterCount: 0 }, 201);
  } catch (err) { return error(err.message); }
});
