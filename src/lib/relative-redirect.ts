import { NextResponse } from 'next/server';

/**
 * A relative Location header keeps redirects on the browser's current public
 * origin, even when the application receives an internal localhost URL from a
 * reverse proxy or container platform.
 */
export function relativeRedirect(pathname: string, status = 303): NextResponse {
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) {
    throw new Error('Redirect path must be a same-origin absolute path.');
  }
  return new NextResponse(null, {
    status,
    headers: { Location: pathname },
  });
}
