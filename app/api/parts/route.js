import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import Part from '@/models/Part';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get('chapterId');
    if (!chapterId || mongoId(chapterId)) return badRequest('Valid chapterId is required');
    await connectDB();
    const parts = await Part.find({ chapterId, userId: session.userId }).sort({ order: 1, createdAt: 1 });
    return success(parts);
  } catch (err) { return error(err.message); }
});

export const POST = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { chapterId, title } = await req.json();
    const cleanTitle = sanitize(title);
    const err = validate(
      mongoId(chapterId, 'chapterId') ? 'Valid chapterId is required' : null,
      required(cleanTitle, 'Title'),
      maxLength(cleanTitle, 200, 'Title'),
    );
    if (err) return badRequest(err);
    await connectDB();
    const count = await Part.countDocuments({ chapterId, userId: session.userId });
    const part  = await Part.create({ userId: session.userId, chapterId, title: cleanTitle, content: null, order: count });
    return success(part, 201);
  } catch (err) { return error(err.message); }
});
