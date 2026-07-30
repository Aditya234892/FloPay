/**
 * One-time cleanup of localStorage keys left behind by earlier builds.
 *
 * The app was renamed and its storage namespace moved from `prism.*` to
 * `flopay.*`. Without this, every browser that had used the old build keeps a
 * dead `prism.token` — a discarded credential that nothing ever clears — plus
 * stale demo API keys, indefinitely.
 */

/**
 * Both separators are listed deliberately: the first build namespaced with an
 * underscore (`razorclone_token`), the second with a dot (`prism.token`). Only
 * matching one of them leaves dead credentials behind.
 */
const LEGACY_PREFIXES = ['prism.', 'prism_', 'razorclone.', 'razorclone_'] as const

export function purgeLegacyStorage(): void {
  if (typeof localStorage === 'undefined') return

  try {
    const stale = Object.keys(localStorage).filter((key) =>
      LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)),
    )
    for (const key of stale) localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Failing to
    // tidy up is not worth breaking startup over.
  }
}
