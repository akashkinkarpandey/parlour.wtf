import { defineMiddleware } from 'astro:middleware';

// Baseline security headers for every response the Worker actually renders
// (in practice just /api/*, since index/404 are prerendered and served
// straight from the assets layer — see public/_headers for those).
export const onRequest = defineMiddleware(async (_ctx, next) => {
  const response = await next();
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  // API responses are JSON, not documents — lock everything down.
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'",
  );
  return response;
});
