import { connectDB } from '@/lib/mongodb';
import { success, error, badRequest, notFound } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { validate, maxLength, mongoId, sanitize } from '@/lib/validate';
import { getSessionFromRequest } from '@/lib/session';
import QA from '@/models/QA';

const AUTH_ERR = () => error('Authentication required.', 401);

export const GET = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Q&A item');
    await connectDB();
    const item = await QA.findOne({ _id: id, userId: session.userId });
    if (!item) return notFound('Q&A item');
    return success(item);
  } catch (err) { return error(err.message); }
});

export const PUT = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Q&A item');
    const body   = await req.json();
    const update = {};
    if (body.question !== undefined) {
      const cleanQ = sanitize(body.question);
      const err = validate(maxLength(cleanQ, 1000, 'Question'));
      if (err) return badRequest(err);
      update.question = cleanQ;
    }
    if (body.answer !== undefined) update.answer = body.answer;
    await connectDB();
    const item = await QA.findOneAndUpdate(
      { _id: id, userId: session.userId },
      update,
      { new: true }
    );
    if (!item) return notFound('Q&A item');
    return success(item);
  } catch (err) { return error(err.message); }
});

export const DELETE = withRateLimit(async (req, { params }) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return AUTH_ERR();
    const { id } = await params;
    if (mongoId(id)) return notFound('Q&A item');
    await connectDB();
    const item = await QA.findOneAndDelete({ _id: id, userId: session.userId });
    if (!item) return notFound('Q&A item');
    return success({ success: true });
  } catch (err) { return error(err.message); }
});
