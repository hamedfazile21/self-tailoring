import { NextFunction, Request, Response } from 'express';

/**
 * Marks every API response as uncacheable.
 *
 * Without this, Express serves JSON with an ETag and no `Cache-Control`, so the
 * browser revalidates on each call and Express answers `304 Not Modified` with
 * no body. Just as importantly, once these routes are behind JWT auth the
 * payloads are per-user and must never land in a disk or proxy cache.
 *
 * Deliberately middleware rather than an interceptor: guards run before
 * interceptors, so an interceptor would skip every 401/403 and anything an
 * exception filter produces.
 */
export function noCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  // Keeps a shared cache from mixing up users even if it ignores `no-store`.
  // Includes `Origin` because CORS relies on it and we overwrite the header.
  res.setHeader('Vary', 'Origin, Authorization');
  next();
}
