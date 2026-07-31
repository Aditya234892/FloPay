import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shells load the *bundled* `dist` output (built by `npm run
 * build`), not a remote URL — that's what makes this a real installable app
 * rather than a thin browser wrapper: it works offline-first, and app-store
 * review treats "ships its own assets" very differently from "just opens a
 * website." Point `VITE_API_BASE_URL` at the deployed backend before
 * building for a release; see README-mobile.md.
 */
const config: CapacitorConfig = {
  appId: 'com.flopay.wallet',
  appName: 'FloPay',
  webDir: 'dist',
  android: {
    // https:// avoids the mixed-content issues a plain http:// WebView
    // origin runs into when calling an https API — Capacitor serves the
    // bundled assets from this synthetic origin regardless of scheme.
    androidScheme: 'https',
  },
  ios: {
    scheme: 'FloPay',
  },
}

export default config
