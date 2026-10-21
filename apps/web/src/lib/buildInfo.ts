/**
 * Build identity, injected at build time by vite.config.ts.
 *
 * Exposed on `window.__GEM_BUILD__` so anyone — including an agent checking
 * whether a deploy landed — can read it with one request rather than grepping
 * a hashed bundle for a string.
 */
declare const __BUILD_COMMIT__: string;
declare const __BUILT_AT__: string;

export const BUILD_COMMIT = __BUILD_COMMIT__;
export const BUILT_AT = __BUILT_AT__;

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__GEM_BUILD__ = {
    commit: BUILD_COMMIT,
    builtAt: BUILT_AT,
  };
}
