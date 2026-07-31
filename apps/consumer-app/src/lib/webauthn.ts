/**
 * Thin wrapper around the native WebAuthn Level 3 JSON methods
 * (`PublicKeyCredential.parseCreationOptionsFromJSON`/`.toJSON()`) — no
 * third-party polyfill needed, these ship in every browser this PWA targets.
 * Keeps the raw `navigator.credentials` calls out of screen components.
 */

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window
}

/** Runs a full registration ceremony and returns the JSON to send back to the server. */
export async function createPasskey(creationOptionsJson: unknown): Promise<unknown> {
  const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(
    creationOptionsJson as PublicKeyCredentialCreationOptionsJSON,
  )
  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
  if (!credential) throw new Error('No passkey was created.')
  return credential.toJSON()
}

/** Runs a full authentication ceremony and returns the JSON to send back to the server. */
export async function getPasskeyAssertion(requestOptionsJson: unknown): Promise<unknown> {
  const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(
    requestOptionsJson as PublicKeyCredentialRequestOptionsJSON,
  )
  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null
  if (!credential) throw new Error('No passkey was selected.')
  return credential.toJSON()
}
