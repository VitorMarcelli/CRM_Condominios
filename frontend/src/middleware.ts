import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // E.g. hostname: 'meucondominio.localhost:3000' or 'meucondominio.seudominio.com.br'
  const currentHost =
    process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
      ? hostname.replace(`.yourdomain.com`, '')
      : hostname.replace(`.localhost:3000`, ''); // For local development

  // Exclude root domain and system subdomains (like www, api, admin)
  let tenantSlug: string | null = null;

  const isLocalhost = currentHost === 'localhost:3000';
  const isVercelApp = currentHost.includes('.vercel.app');

  // 1. Subdomain-based (only if it's a real custom domain, not localhost or vercel.app)
  if (currentHost && !isLocalhost && !isVercelApp && currentHost !== 'www' && currentHost !== 'yourdomain.com') {
    tenantSlug = currentHost;
  }

  // 2. Path-based fallback (e.g., crm.vercel.app/t/condominio-a/dashboard)
  // This is perfect for free hosting without wildcard domains.
  let isPathBased = false;
  if (url.pathname.startsWith('/t/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts.length >= 3) {
      tenantSlug = pathParts[2];
      isPathBased = true;
      // Rewrite the URL to remove the /t/[slug] prefix so Next.js finds the actual page (e.g. /dashboard)
      url.pathname = '/' + pathParts.slice(3).join('/');
    }
  }

  // If no tenant is found, just pass through (might be the landing page or login)
  if (!tenantSlug) {
    return NextResponse.next();
  }

  // We inject the tenant slug as a header so server components can access it.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);

  // If we altered the path for path-based routing, we must rewrite
  if (isPathBased) {
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Otherwise (subdomain), just continue
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
