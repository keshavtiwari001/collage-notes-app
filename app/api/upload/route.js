import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';
import { error, success } from '@/lib/apiResponse';
import { getSessionFromRequest } from '@/lib/session';
import cloudinary from '@/lib/cloudinary';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const POST = withRateLimit(async (req) => {
  try {
    // Auth check — only authenticated users can upload
    const session = getSessionFromRequest(req);
    if (!session) return error('Authentication required.', 401);

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) return error('No file provided', 400);
    if (!file.type?.startsWith('image/')) return error('Only image files are allowed', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) return error('Image must be under 5MB', 400);

    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder:          'academica',
      resource_type:   'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return success({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    return error(err.message || 'Upload failed');
  }
});
