/**
 * Re-exports the shared wire types so every existing `@/api/types` import in
 * this app keeps working unchanged. The types themselves now live in
 * `@flopay/api-types`, shared with the consumer wallet app — see that package
 * for the actual definitions.
 */
export * from '@flopay/api-types'
