import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import { checkEnv } from '@/lib/env';
import AcademicPeriod from '@/models/AcademicPeriod';
import Subject from '@/models/Subject';

checkEnv();

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    await connectDB();
    const periods = await AcademicPeriod.find({ userId: session.userId }).sort({ order: 1, createdAt: 1 });
    const counts  = await Subject.aggregate([
      { $match: { userId: session.userId } },
      { $group: { _id: '$periodId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    const data = periods.map(p => ({ ...p.toObject(), subjectCount: countMap[p._id.toString()] || 0 }));
    return success(data);
  } catch (err) { return error(err.message); }
});

export const POST = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    await connectDB();
    const { name, type } = await req.json();
    const clean = sanitize(name);
    const err = validate(required(clean, 'Name'), maxLength(clean, 100, 'Name'));
    if (err) return badRequest(err);
    const count  = await AcademicPeriod.countDocuments({ userId: session.userId });
    const period = await AcademicPeriod.create({ userId: session.userId, name: clean, type: type || 'semester', order: count });
    return success({ ...period.toObject(), subjectCount: 0 }, 201);
  } catch (err) { return error(err.message); }
});
