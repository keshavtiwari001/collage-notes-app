import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { getSessionFromRequest } from '@/lib/session';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import Part from '@/models/Part';

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return error('Authentication required.', 401);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    if (!q || q.length < 2) return success({ subjects: [], chapters: [], parts: [] });
    if (q.length > 200) return badRequest('Search query too long');

    await connectDB();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(escaped, 'i');
    const uid     = session.userId;

    const [subjects, chapters, parts] = await Promise.all([
      Subject.find({ userId: uid, name: regex }).limit(8).populate('periodId', 'name'),
      Chapter.find({ userId: uid, title: regex }).limit(8).populate({
        path: 'subjectId', select: 'name color periodId',
        populate: { path: 'periodId', select: 'name' },
      }),
      Part.find({ userId: uid, title: regex }).limit(8).populate({
        path: 'chapterId', select: 'title subjectId',
        populate: { path: 'subjectId', select: 'name color periodId', populate: { path: 'periodId', select: 'name' } },
      }),
    ]);

    return success({
      subjects: subjects.map(s => ({ _id: s._id, name: s.name, color: s.color, periodId: s.periodId?._id, periodName: s.periodId?.name })),
      chapters: chapters.map(c => ({ _id: c._id, title: c.title, subjectId: c.subjectId?._id, subjectName: c.subjectId?.name, subjectColor: c.subjectId?.color, periodId: c.subjectId?.periodId?._id, periodName: c.subjectId?.periodId?.name })),
      parts:    parts.map(p => ({ _id: p._id, title: p.title, chapterId: p.chapterId?._id, chapterTitle: p.chapterId?.title, subjectId: p.chapterId?.subjectId?._id, subjectName: p.chapterId?.subjectId?.name, subjectColor: p.chapterId?.subjectId?.color, periodId: p.chapterId?.subjectId?.periodId?._id, periodName: p.chapterId?.subjectId?.periodId?.name })),
    });
  } catch (err) { return error(err.message); }
});
