import { connectDB } from '@/lib/mongodb';
import { success } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimit';
import { getSessionFromRequest } from '@/lib/session';
import User from '@/models/User';

export const GET = withRateLimit(async (req) => {
  try {
    const session = getSessionFromRequest(req);
    if (!session?.userId) {
      return success({ authenticated: false });
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select('email name emailVerified')
      .lean();
    if (!user) {
      return success({ authenticated: false });
    }

    return success({
      authenticated: true,
      user: {
        id:            user._id.toString(),
        email:         user.email,
        name:          user.name,
        emailVerified: user.emailVerified,
      },
    });
  } catch {
    return success({ authenticated: false });
  }
});
