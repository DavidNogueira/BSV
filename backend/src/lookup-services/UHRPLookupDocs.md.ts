// TODO 1: Implement documentation string for ls_uhrp
export default `# UHRP Lookup Service (ls_uhrp)

Indexes UHRP advertisements admitted by the \`tm_uhrp\` Topic Manager, so
clients can resolve a UHRP URL to the outpoint(s) currently hosting it.

## Storage

Each admitted advertisement is stored as a record with:

- \`txid\` / \`outputIndex\` - the outpoint of the advertisement.
- \`uhrpUrl\` - the UHRP URL derived from the file's hash.
- \`hostIdentityKey\` - the public key of the hosting party.
- \`url\` - the HTTP(S) URL where the file can be retrieved.
- \`expiryTime\` - the UNIX timestamp (seconds) after which hosting is no
  longer guaranteed.
- \`fileSize\` - the size of the hosted file, in bytes.

Records are removed when their advertisement is spent (\`outputSpent\`) or
evicted from the overlay (\`outputEvicted\`).

## Queries

The lookup service accepts a query object with any of the following optional
fields:

- \`txid\` and \`outputIndex\` - resolve a specific outpoint.
- \`uhrpUrl\` - find advertisements for a given UHRP URL.
- \`expiryTime\` - find advertisements expiring at or after a given timestamp.
- \`hostIdentityKey\` - find advertisements made by a specific host.

It returns the matching outpoint(s) as a Lookup Formula for the Overlay
Services Engine to resolve into a full Lookup Answer.
`
