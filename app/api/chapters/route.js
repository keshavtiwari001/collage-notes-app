import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import Chapter from '@/models/Chapter';
import Part from '@/models/Part';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    if (!subjectId || mongoId(subjectId)) return badRequest('Valid subjectId is required');
    await connectDB();
    const chapters = await Chapter.find({ subjectId, userId: session.userId }).sort({ order: 1, createdAt: 1 });
    const counts   = await Part.aggregate([
      { $match: { chapterId: { $in: chapters.map(c => c._id) }, userId: session.userId } },
      { $group: { _id: '$chapterId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    return success(chapters.map(c => ({ ...c.toObject(), partCount: countMap[c._id.toString()] || 0 })));
  } catch (err) { return error(err.message); }
});

export const POST = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { subjectId, title } = await req.json();
    const cleanTitle = sanitize(title);
    const err = validate(
      mongoId(subjectId, 'subjectId') ? 'Valid subjectId is required' : null,
      required(cleanTitle, 'Title'),
      maxLength(cleanTitle, 200, 'Title'),
    );
    if (err) return badRequest(err);
    await connectDB();
    const count   = await Chapter.countDocuments({ subjectId, userId: session.userId });
    const chapter = await Chapter.create({ userId: session.userId, subjectId, title: cleanTitle, order: count });
    return success({ ...chapter.toObject(), partCount: 0 }, 201);
  } catch (err) { return error(err.message); }
});
