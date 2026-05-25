async function generatePresentationKey(
  privateKeyHex: string,
  context = 'presentation-key'
): Promise<string> {
  if (!privateKeyHex) {
    throw new Error('Private key is missing')
  }

  const cleanHex = privateKeyHex.trim().replace(/^0x/, '')

  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error('Invalid hex private key')
  }

  if (cleanHex.length !== 64) {
    throw new Error('Private key must be 32 bytes (64 hex chars)')
  }

  const matches = cleanHex.match(/.{1,2}/g)

  if (!matches) {
    throw new Error('Failed to parse hex')
  }

  const keyBytes = Uint8Array.from(matches.map(byte => parseInt(byte, 16)))

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(context)
  )

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default generatePresentationKey
