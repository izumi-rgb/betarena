import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type RouterProps = {
  children: React.ReactNode;
};

type LinkProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type RouteProps = {
  path?: string;
  element?: React.ReactNode;
};

export function BrowserRouter({ children }: RouterProps) {
  return <>{children}</>;
}

function normalizePath(input: string) {
  if (!input) return '/';

  const [rawPath] = input.split(/[?#]/);
  const cleaned = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  const lower = cleaned.toLowerCase() || '/';

  const map: Record<string, string> = {
    '/': '/sports',
    '/home': '/sports',
    '/sport': '/sports',
    '/sportsbook': '/sports',
    '/inplay': '/in-play',
    '/in-play': '/in-play',
    '/mybets': '/my-bets',
    '/my-bets': '/my-bets',
    '/my-account': '/account',
    '/account': '/account',
    '/livestream': '/live',
    '/live-stream': '/live',
    '/live': '/live',
    '/agent-dashboard': '/dashboard',
    '/agent-reports': '/reports',
    '/admin-dashboard': '/overview',
    '/horse-racing': '/sports/horse-racing',
  };

  return (map[lower] ?? cleaned) || '/';
}

/** Uses Next.js Link so navigation is client-side (no full reload). */
export function Link({ children, to, href, style, ...rest }: LinkProps) {
  const path = normalizePath(href ?? to ?? '#');
  return (
    <NextLink href={path} style={style} {...rest}>
      {children}
    </NextLink>
  );
}

export function Route() {
  return null;
}

export function Routes({ children }: RouterProps) {
  const items = React.Children.toArray(children) as React.ReactElement<RouteProps>[];
  const first = items.find((item) => item?.props?.element);
  return <>{first?.props?.element ?? null}</>;
}

export function useNavigate() {
  const router = useRouter();
  return (to: string, options?: { replace?: boolean }) => {
    const target = normalizePath(to);
    if (options?.replace) {
      router.replace(target);
      return;
    }
    router.push(target);
  };
}

export function useLocation() {
  const pathname = normalizePath(usePathname() ?? '/');
  return { pathname, search: '', hash: '', state: null, key: 'next' };
}
