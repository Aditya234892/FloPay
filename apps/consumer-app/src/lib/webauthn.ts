/**
 * Thin wrapper around the native WebAuthn Level 3 JSON methods
 * (`PublicKeyCredential.parseCreationOptionsFromJSON`/`.toJSON()`) — no
 * third-party polyfill needed, these ship in every browser this PWA targets.
 * Keeps the raw `navigator.credentials` calls out of screen components.
 */

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window
}

/**
 * The server sends the Yubico library's `toCredentialsCreateJson()`/
 * `toCredentialsGetJson()` output verbatim, which is already wrapped in the
 * shape `navigator.credentials.create()`/`.get()` expect — i.e.
 * `{ publicKey: { rp, user, challenge, ... } }` — not the bare options
 * object. `parseCreationOptionsFromJSON`/`parseRequestOptionsFromJSON` want
 * just the inner `publicKey` value.
 */
interface PublicKeyWrapper<T> {
  publicKey: T
}

/** Runs a full registration ceremony and returns the JSON to send back to the server. */
export async function createPasskey(creationOptionsJson: unknown): Promise<unknown> {
  const { publicKey: options } = creationOptionsJson as PublicKeyWrapper<PublicKeyCredentialCreationOptionsJSON>
  const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(options)
  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
  if (!credential) throw new Error('No passkey was created.')
  return credential.toJSON()
}

/** Runs a full authentication ceremony and returns the JSON to send back to the server. */
export async function getPasskeyAssertion(requestOptionsJson: unknown): Promise<unknown> {
  const { publicKey: options } = requestOptionsJson as PublicKeyWrapper<PublicKeyCredentialRequestOptionsJSON>
  const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(options)
  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null
  if (!credential) throw new Error('No passkey was selected.')
  return credential.toJSON()
}
