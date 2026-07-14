// TODO 1: Implement documentation string for tm_uhrp
export default `# UHRP Topic Manager (tm_uhrp)

Tracks on-chain advertisements for the Universal Hash Resolution Protocol (UHRP).

## Purpose

A UHRP advertisement is a PushDrop-locked output that tells the network a given
file (identified by its SHA-256 hash) is being hosted at a specific URL until a
given expiry time. This Topic Manager decides which outputs in a transaction
are valid UHRP advertisements, so they can be admitted into the \`tm_uhrp\`
overlay topic and indexed by the \`ls_uhrp\` Lookup Service.

## Token Fields

Each admissible output is a PushDrop token with the following fields, in order:

1. **Address** - the identity public key of the host making the advertisement.
2. **Hash** - the 32-byte SHA-256 hash of the hosted file.
3. **URL** - the HTTP(S) URL where the file can currently be retrieved.
4. **Expiry** - a VarInt-encoded UNIX timestamp (seconds) after which the
   advertisement is no longer valid.
5. **Size** - a VarInt-encoded file size, in bytes.

The token is signed by the key identified in the Address field, over the
preceding fields, so that its authenticity can be verified.

## Admittance Rules

An output is admitted when:

- Its locking script decodes as a valid PushDrop token with the fields above.
- The embedded signature verifies against the Address field.
- The Hash is exactly 32 bytes.
- The URL is a well-formed absolute HTTP or HTTPS URL.
- The Expiry has not already passed.
- The Size is a positive integer.
`
