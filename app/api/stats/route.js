import { connectDB } from '@/lib/mongodb';
import { success, error } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { getSessionFromRequest } from '@/lib/session';
import AcademicPeriod from '@/models/AcademicPeriod';
import Subject from '@/models/Subject';
import Chapter from '@/models/Chapter';
import QA from '@/models/QA';

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return error('Authentication required.', 401);

    await connectDB();
    const uid = session.userId;

    const [periods, subjects, chapters, qaItems, recentChapters] = await Promise.all([
      AcademicPeriod.countDocuments({ userId: uid }),
      Subject.countDocuments({ userId: uid }),
      Chapter.countDocuments({ userId: uid }),
      QA.countDocuments({ userId: uid }),
      Chapter.find({ userId: uid }).sort({ updatedAt: -1 }).limit(5).populate({
        path: 'subjectId', select: 'name color periodId',
        populate: { path: 'periodId', select: 'name' },
      }),
    ]);

    const recent = recentChapters.map(c => ({
      _id: c._id, title: c.title, updatedAt: c.updatedAt,
      subjectId:    c.subjectId?._id,
      subjectName:  c.subjectId?.name,
      subjectColor: c.subjectId?.color,
      periodId:     c.subjectId?.periodId?._id,
      periodName:   c.subjectId?.periodId?.name,
    }));

    return success({ periods, subjects, chapters, qaItems, recent });
  } catch (err) { return error(err.message); }
});
