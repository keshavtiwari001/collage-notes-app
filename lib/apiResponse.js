import { NextResponse } from 'next/server';

export function success(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function tooManyRequests(retryAfter = 60) {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
