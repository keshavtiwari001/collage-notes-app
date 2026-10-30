import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest, notFound } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, required, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import Chapter from '@/models/Chapter';
import Part from '@/models/Part';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Chapter');
    await connectDB();
    const chapter = await Chapter.findOne({ _id: id, userId: session.userId });
    if (!chapter) return notFound('Chapter');
    return success(chapter);
  } catch (err) { return error(err.message); }
});

export const PUT = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Chapter');
    const { title } = await req.json();
    const cleanTitle = sanitize(title);
    const err = validate(required(cleanTitle, 'Title'), maxLength(cleanTitle, 200, 'Title'));
    if (err) return badRequest(err);
    await connectDB();
    const chapter = await Chapter.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { title: cleanTitle },
      { new: true }
    );
    if (!chapter) return notFound('Chapter');
    return success(chapter);
  } catch (err) { return error(err.message); }
});

export const DELETE = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Chapter');
    await connectDB();
    const chapter = await Chapter.findOneAndDelete({ _id: id, userId: session.userId });
    if (!chapter) return notFound('Chapter');
    await Part.deleteMany({ chapterId: id });
    return success({ success: true });
  } catch (err) { return error(err.message); }
});
