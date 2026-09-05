/**
 * Runtime environment access that works on both Netlify Functions and the
 * Cloudflare Workers runtime.
 *
 * On Cloudflare, bindings are only attached to `process.env` once a request is
 * in flight (nodejs_compat + a 2025-04-01 or later compatibility date), so
 * nothing here may run during top-level module evaluation. Call these from
 * inside a request instead.
 */
export function readEnv(key: string): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.[key] : undefined
  return (
    fromProcess ??
    (import.meta.env as Record<string, string | undefined>)[key]
  )
}

/** True on the noindex Cloudflare preview deploy; unset in production. */
export function isPreview(): boolean {
  return Boolean(readEnv('PREVIEW_NOINDEX'))
}
