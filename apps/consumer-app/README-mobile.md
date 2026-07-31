# FloPay Wallet — Android & iOS

The consumer wallet is wrapped with [Capacitor](https://capacitorjs.com) rather
than a hand-rolled WebView: Capacitor bundles the built web app (`dist/`)
into a real native shell with its own installable package (`.apk`/`.aab` for
Android, `.ipa` for iOS), rather than pointing a bare WebView at a remote
URL — the difference matters both for offline behavior and for app-store
review, which treats "ships its own assets" very differently from "just
opens a website."

`android/` and `ios/` are the generated native projects (`npx cap add
android` / `ios`). They're real Gradle/Xcode projects checked in like any
other native app — building them requires tools this repo's own dev
environment doesn't have (Android Studio + the Android SDK; Xcode on
macOS for iOS), so **building and signing the actual installable packages
has to happen on a machine with those tools**, not from this repo's usual
`pnpm`/`mvn` workflow.

## One-time setup (on a machine with Android Studio and/or Xcode)

1. `pnpm install` at the repo root.
2. Point the build at your deployed API — create `apps/consumer-app/.env.production`:
   ```
   VITE_API_BASE_URL=https://your-deployed-gateway-api.example.com
   ```
   (Skip this to keep pointing at `http://localhost:8080`, only useful for
   testing against a local backend from an emulator — see the networking
   note below.)
3. Regenerate app icons/splash from a real 1024×1024 source (the scaffold
   ships Capacitor's placeholder icon):
   ```
   npx @capacitor/assets generate --iconBackgroundColor '#0F172A' --splashBackgroundColor '#0F172A'
   ```
   (Needs a `resources/icon.png` — start from `public/icon-512.png`,
   upscaled, or a fresh export.)

## Every time you change the web app

```
npm run cap:sync      # builds the web app, copies dist/ into android/ and ios/
npm run cap:android   # ...then opens the project in Android Studio
npm run cap:ios       # ...then opens the project in Xcode (macOS only)
```

From there, Android Studio / Xcode build, sign, and run the app exactly
like any other native project — `Run` on an emulator/device, or
`Build > Generate Signed Bundle/APK` (Android) / `Product > Archive`
(iOS) for a release build to upload to Play Console / App Store Connect.

## Backend CORS

The native shell serves the app from a synthetic origin, not a real
domain: `https://localhost` on Android, `capacitor://localhost` on iOS.
The backend's dev default (`application.yml`) already allows both. A
**production** deployment must add both to its own `FLOPAY_ALLOWED_ORIGINS`
alongside the real web origins — that env var fully replaces the default
rather than extending it.

## Networking against a local backend

An Android emulator can't reach your machine's `localhost` directly — use
`http://10.0.2.2:8080` (the emulator's alias for the host) as
`VITE_API_BASE_URL` instead when testing against a locally-running
`gateway-api`. A physical device needs the backend reachable on your LAN
IP instead, with that IP in `FLOPAY_ALLOWED_ORIGINS`.

## Known platform gaps

- **Passkey login (WebAuthn)**: Android's system WebView has supported the
  WebAuthn API since roughly version 108; iOS's WKWebView gained it more
  recently. Whether it works depends on the OS/WebView version on the
  test device — the phone-entry screen only offers it when
  `window.PublicKeyCredential` exists, and OTP login always works
  regardless, so this degrades gracefully rather than breaking anything.
- **Camera (QR scanning)**: uses the web `getUserMedia()` API through the
  WebView, gated by the `CAMERA` permission (Android manifest) /
  `NSCameraUsageDescription` (iOS Info.plist) already added — the OS
  still prompts the user the first time, same as any native camera use.
- **Push notifications**: not wired up. FloPay's notifications are
  in-app/polled today (`com.flopay.notification`); real push would need
  `@capacitor/push-notifications` plus FCM/APNs credentials, out of scope
  here.
