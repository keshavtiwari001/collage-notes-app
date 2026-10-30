import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import QA from '@/models/QA';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    if (!subjectId || mongoId(subjectId)) return badRequest('Valid subjectId is required');
    await connectDB();
    const items = await QA.find({ subjectId, userId: session.userId }).sort({ order: 1, createdAt: 1 });
    return success(items);
  } catch (err) { return error(err.message); }
});

export const POST = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { subjectId, question } = await req.json();
    const cleanQ = sanitize(question);
    const err = validate(
      mongoId(subjectId, 'subjectId') ? 'Valid subjectId is required' : null,
      required(cleanQ, 'Question'),
      maxLength(cleanQ, 1000, 'Question'),
    );
    if (err) return badRequest(err);
    await connectDB();
    const count = await QA.countDocuments({ subjectId, userId: session.userId });
    const item  = await QA.create({ userId: session.userId, subjectId, question: cleanQ, answer: null, order: count });
    return success(item, 201);
  } catch (err) { return error(err.message); }
});
