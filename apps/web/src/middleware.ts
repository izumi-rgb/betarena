import { NextRequest, NextResponse } from 'next/server';

function decodeRole(token?: string): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = pathname === '/' || pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/api');
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('access_token')?.value;
  const role = decodeRole(token);

  // Public browsing is allowed for member-facing routes.
  // Login is only required when entering restricted role areas or performing protected actions.
  if (!token && (pathname.startsWith('/admin') || pathname.startsWith('/agent/'))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!role) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    const dest = role === 'agent' || role === 'sub_agent' ? '/agent/dashboard' : '/sports';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (pathname.startsWith('/agent/') && role !== 'agent' && role !== 'sub_agent') {
    const dest = role === 'admin' ? '/admin/overview' : '/sports';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if ((pathname.startsWith('/sports') || pathname.startsWith('/results') || pathname.startsWith('/my-bets') || pathname.startsWith('/account') || pathname.startsWith('/in-play') || pathname.startsWith('/live')) && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/overview', req.url));
  }

  if ((pathname.startsWith('/sports') || pathname.startsWith('/results') || pathname.startsWith('/my-bets') || pathname.startsWith('/account')) && (role === 'agent' || role === 'sub_agent')) {
    return NextResponse.redirect(new URL('/agent/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
