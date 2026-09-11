/**
 * Runtime configuration for locating the backend API.
 *
 * - In the browser (PWA / `ng serve`) requests use relative `/api` and `/uploads`
 *   paths, which are handled by the dev-server proxy or same-origin hosting.
 * - Inside a Capacitor native app the web layer is served from the device, so
 *   relative paths cannot reach the backend. We prefix them with an absolute URL.
 *
 * The backend address can be configured at runtime (and is remembered on the
 * device) via {@link setConfiguredApiBaseUrl}, e.g. from the login screen. This
 * lets the same installed app point at any backend — a friend's phone can enter
 * the public URL you share without needing a new build. Resolution order:
 *   1. window.__API_BASE_URL__  (compile/host override)
 *   2. the value saved on the device (localStorage)
 *   3. DEFAULT_NATIVE_API when running as a native app
 *   4. "" (relative paths) on the web
 */
declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
    __API_BASE_URL__?: string;
  }
}

// Fallback used by the native app when no server URL has been configured yet.
// This is a local-network address; for sharing with others, configure a public
// URL in the app (login screen → Server settings) or via window.__API_BASE_URL__.
const DEFAULT_NATIVE_API = 'http://192.168.1.19:8081';

const STORAGE_KEY = 'roomrent.apiBaseUrl';

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function isNativePlatform(): boolean {
  return !!window.Capacitor?.isNativePlatform?.();
}

/** The server URL saved on this device, or '' if none has been set. */
export function getConfiguredApiBaseUrl(): string {
  try {
    return normalize(localStorage.getItem(STORAGE_KEY) ?? '');
  } catch {
    return '';
  }
}

/** Persist (or clear, when empty) the server URL used by this device. */
export function setConfiguredApiBaseUrl(url: string): void {
  try {
    const value = normalize(url ?? '');
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore storage errors (e.g. private mode) */
  }
}

/** The value shown as the default in the server-settings field. */
export function defaultApiBaseUrl(): string {
  return isNativePlatform() ? DEFAULT_NATIVE_API : '';
}

export function apiBaseUrl(): string {
  const override = window.__API_BASE_URL__;
  if (override) return normalize(override);
  const configured = getConfiguredApiBaseUrl();
  if (configured) return configured;
  if (isNativePlatform()) return DEFAULT_NATIVE_API;
  return '';
}
