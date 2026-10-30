import { NextResponse } from 'next/server';
import { buildClearCookieHeader } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' }, { status: 200 });
  response.headers.set('Set-Cookie', buildClearCookieHeader());
  return response;
}
