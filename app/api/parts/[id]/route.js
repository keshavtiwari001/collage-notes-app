import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest, notFound } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import Part from '@/models/Part';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Part');
    await connectDB();
    const part = await Part.findOne({ _id: id, userId: session.userId });
    if (!part) return notFound('Part');
    return success(part);
  } catch (err) { return error(err.message); }
});

export const PUT = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Part');
    const body   = await req.json();
    const update = {};
    if (body.title !== undefined) {
      const cleanTitle = sanitize(body.title);
      const err = validate(maxLength(cleanTitle, 200, 'Title'));
      if (err) return badRequest(err);
      update.title = cleanTitle;
    }
    if (body.content !== undefined) update.content = body.content;
    await connectDB();
    const part = await Part.findOneAndUpdate(
      { _id: id, userId: session.userId },
      update,
      { new: true }
    );
    if (!part) return notFound('Part');
    return success(part);
  } catch (err) { return error(err.message); }
});

export const DELETE = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Part');
    await connectDB();
    const part = await Part.findOneAndDelete({ _id: id, userId: session.userId });
    if (!part) return notFound('Part');
    return success({ success: true });
  } catch (err) { return error(err.message); }
});
