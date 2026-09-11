import { HttpInterceptorFn } from '@angular/common/http';
import { apiBaseUrl } from './runtime-config';

/**
 * Rewrites relative `/api` and `/uploads` requests to an absolute backend URL
 * when running outside a same-origin web context (e.g. a Capacitor native app).
 * On the web this is a no-op because the base URL is empty.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = apiBaseUrl();
  if (base && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))) {
    return next(req.clone({ url: base + req.url }));
  }
  return next(req);
};
