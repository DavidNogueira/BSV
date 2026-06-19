import {
  WalletClient,
  Utils,
  ECDSA,
  PublicKey,
  Hash,
  BigNumber,
  Signature,
  PushDrop,
  Transaction,
  MasterCertificate,
  ProtoWallet,
  VerifiableCertificate
} from '@bsv/sdk'

const walletClient = new WalletClient()

const KEY_ID = '1'

// Define a minimal Certificate interface for TypeScript
interface Certificate {
  type: string
  fields: Record<string, string>
  keyring?: Record<string, string> | string // Support both object and string keyring formats
  serialNumber: string
  subject: string
  certifier: string
  revocationOutpoint: string
  signature: string
}

// Define the expected structure of ListCertificatesResult
interface ListCertificatesResult {
  certificates: Certificate[]
  totalCertificates: number
}

// Utility to create a test certificate with a valid signature
async function createTestCertificate(): Promise<Certificate> {
  try {
    const { publicKey: subject } = await walletClient.getPublicKey({
      identityKey: true
    })
    if (!subject) {
      throw new Error(
        'Failed to retrieve wallet client identity key for subject'
      )
    }

    const certificateType = Utils.toBase64(Utils.toArray('emailCert', 'utf8'))

    const randomBytes = new Uint8Array(32)
    window.crypto.getRandomValues(randomBytes)
    const randomBytesArray = Array.from(randomBytes)
    const randomHex = Utils.toHex(randomBytesArray)
    const serialNumber = Utils.toBase64(Utils.toArray(randomHex, 'utf8'))

    const fields = {
      email: Utils.toBase64(Utils.toArray('bob@projectbabbage.com', 'utf8'))
    }

    const { publicKey: certifier } = await walletClient.getPublicKey({
      identityKey: true
    })
    if (!certifier) {
      throw new Error(
        'Failed to retrieve wallet client identity key for certifier'
      )
    }

    const mockTxid = 'a'.repeat(64)
    const revocationOutpoint = `${mockTxid}.0`

    const certData = JSON.stringify({
      type: certificateType,
      serialNumber,
      subject,
      certifier,
      revocationOutpoint,
      fields
    })
    const certDataArray = Utils.toArray(certData, 'utf8') as number[]

    const signatureResponse = await walletClient.createSignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      data: certDataArray,
      counterparty: 'self'
    })

    if (!signatureResponse.signature) {
      throw new Error('Signature creation failed: Signature is undefined.')
    }

    const signatureObj = Signature.fromDER(signatureResponse.signature)
    const signature = Utils.toHex(signatureObj.toDER() as number[])

    const certificate: Certificate = {
      type: certificateType,
      serialNumber,
      subject,
      certifier,
      revocationOutpoint,
      fields,
      signature
    }

    return certificate
  } catch (error) {
    console.error(
      'Failed to create test certificate:',
      (error as Error).message
    )
    throw new Error(
      `Test certificate creation failed: ${(error as Error).message}`
    )
  }
}

// Utility to convert number[] to hex string
const toHex = (array: number[]): string => {
  return Array.from(array)
    .map(byte => (byte & 0xff).toString(16).padStart(2, '0'))
    .join('')
}

// Utility to convert hex string to number[]
const fromHex = (hex: string): number[] => {
  return Utils.toArray(hex, 'hex')
}

// Utility to convert string to base64 using @bsv/sdk Utils
const toBase64 = (str: string): string => {
  const bytes = Utils.toArray(str, 'utf8')
  return Utils.toBase64(bytes)
}

// Utility to validate a public key format
const validatePublicKey = (key: string): void => {
  try {
    if (
      /^[a-zA-Z0-9]+$/.test(key) &&
      !/^[0-9a-fA-F]{66}$|^[0-9a-fA-F]{130}$/.test(key)
    ) {
      return // Valid wallet ID, no further validation needed
    }
    if (!/^[0-9a-fA-F]{66}$|^[0-9a-fA-F]{130}$/.test(key)) {
      throw new Error(
        'Invalid public key format: Must be 33 or 65 bytes in hex or a valid wallet ID'
      )
    }
    const pubKey = PublicKey.fromString(key)
    if (!pubKey) {
      throw new Error(
        'Invalid public key: Failed to parse as a valid elliptic curve point'
      )
    }
    console.log(`Validated public key: ${key}`)
  } catch (error) {
    console.error(`Public key validation failed for key: ${key}`, error)
    throw new Error(`Invalid public key: ${(error as Error).message}`)
  }
}

// Utility to decode and verify certificate type
const decryptCertificateType = (
  encodedType: string
): { decodedType: string; isEmailCert: boolean } => {
  try {
    const decodedBytes = Utils.toArray(encodedType, 'base64')
    const decodedType = Utils.toUTF8(decodedBytes)
    const isEmailCert = decodedType === 'emailCert'
    console.log(
      `decryptCertificateType: Decoded type: ${decodedType}, isEmailCert: ${isEmailCert}`
    )
    return { decodedType, isEmailCert }
  } catch (error) {
    console.error(
      `Failed to decode certificate type: ${encodedType}`,
      (error as Error).message
    )
    return { decodedType: encodedType, isEmailCert: false }
  }
}

/**
 * Encrypt a message for yourself (e.g., Alice encrypts for Alice).
 */
export async function encryptForSelf(message: string): Promise<string> {
  // DONE: Implement the logic to encrypt a message for yourself with the following requirements:
  // 1. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 2. Use walletClient.encrypt with protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'self', and the message array as plaintext.
  // 3. Check if the ciphertext is defined; if not, throw an error.
  // 4. Convert the ciphertext to a hex string using toHex.
  // 5. Return the hex string.
  // 6. Handle errors by throwing them with a descriptive message.
  try {
    const plaintext = Utils.toArray(message, 'utf8') as number[]
    const { ciphertext } = await walletClient.encrypt({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'self',
      plaintext
    })
    if (!ciphertext) throw new Error('Ciphertext is undefined')
    return toHex(ciphertext)
  } catch (error) {
    throw new Error(`encryptForSelf failed: ${(error as Error).message}`)
  }
}

/**
 * Decrypt a message encrypted for yourself (e.g., Alice decrypts her own message).
 */
export async function decryptForSelf(ciphertext: string): Promise<string> {
  // DONE: Implement the logic to decrypt a message for yourself with the following requirements:
  // 1. Convert the ciphertext hex string to a byte array using fromHex.
  // 2. Use walletClient.decrypt with protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'self', and the ciphertext array.
  // 3. Check if the plaintext is defined; if not, throw an error.
  // 4. Convert the plaintext byte array to a UTF-8 string using Utils.toUTF8.
  // 5. Return the plaintext string.
  // 6. Handle errors by throwing them with a descriptive message.
  try {
    const ciphertextArray = fromHex(ciphertext)
    const { plaintext } = await walletClient.decrypt({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'self',
      ciphertext: ciphertextArray
    })
    if (!plaintext) throw new Error('Plaintext is undefined')
    return Utils.toUTF8(plaintext)
  } catch (error) {
    throw new Error(`decryptForSelf failed: ${(error as Error).message}`)
  }
}

/**
 * Encrypt a message for a friend (e.g., Alice encrypts for Bob).
 */
export async function encryptForFriend(
  message: string,
  friendIdentity: string
): Promise<{ ciphertext: string; senderIdentity: string }> {
  // DONE: Implement the logic to encrypt a message for a friend with the following requirements:
  // 1. Validate the friendIdentity using validatePublicKey.
  // 2. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 3. Use walletClient.encrypt with protocolID [0, 'cryption'], keyID KEY_ID, counterparty friendIdentity, and the message array as plaintext.
  // 4. Check if the ciphertext is defined; if not, throw an error.
  // 5. Convert the ciphertext to a hex string using toHex.
  // 6. Fetch the sender's public key using walletClient.getPublicKey with identityKey true.
  // 7. Return an object with the ciphertext and senderIdentity.
  // 8. Handle errors by throwing them with a descriptive message.
  try {
    validatePublicKey(friendIdentity)
    const plaintext = Utils.toArray(message, 'utf8') as number[]
    const { ciphertext } = await walletClient.encrypt({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: friendIdentity,
      plaintext
    })
    if (!ciphertext) throw new Error('Ciphertext is undefined')
    const { publicKey: senderIdentity } = await walletClient.getPublicKey({
      identityKey: true
    })
    return { ciphertext: toHex(ciphertext), senderIdentity }
  } catch (error) {
    throw new Error(`encryptForFriend failed: ${(error as Error).message}`)
  }
}

/**
 * Decrypt a message encrypted by a friend (e.g., Bob decrypts Alice’s message).
 */
export async function decryptFromFriend(
  ciphertext: string,
  friendIdentity: string
): Promise<string> {
  // DONE: Implement the logic to decrypt a message from a friend with the following requirements:
  // 1. Validate the friendIdentity using validatePublicKey.
  // 2. Convert the ciphertext hex string to a byte array using fromHex.
  // 3. Use walletClient.decrypt with protocolID [0, 'cryption'], keyID KEY_ID, counterparty friendIdentity, and the ciphertext array.
  // 4. Set a 10-second timeout using Promise.race with a timeoutPromise.
  // 5. Check if the plaintext is defined; if not, throw an error.
  // 6. Convert the plaintext byte array to a UTF-8 string using Utils.toUTF8.
  // 7. Return the plaintext string.
  // 8. Handle errors by throwing them with a descriptive message.
  try {
    validatePublicKey(friendIdentity)
    const ciphertextArray = fromHex(ciphertext)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Decryption timed out after 10 seconds')),
        10000
      )
    )
    const decryptPromise = walletClient.decrypt({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: friendIdentity,
      ciphertext: ciphertextArray
    })
    const { plaintext } = await Promise.race([decryptPromise, timeoutPromise])
    if (!plaintext) throw new Error('Plaintext is undefined')
    return Utils.toUTF8(plaintext)
  } catch (error) {
    throw new Error(`decryptFromFriend failed: ${(error as Error).message}`)
  }
}

/**
 * Sign a message for yourself (e.g., Alice signs for Alice).
 */
export async function signForSelf(message: string): Promise<string> {
  // DONE: Implement the logic to sign a message for yourself with the following requirements:
  // 1. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 2. Use walletClient.createSignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'self', and the message array as data.
  // 3. Check if the signature is defined; if not, throw an error.
  // 4. Parse the signature using Signature.fromDER and convert it to a hex string using toHex.
  // 5. Return the hex string.
  // 6. Handle errors by throwing them with a descriptive message.
  try {
    const data = Utils.toArray(message, 'utf8') as number[]
    const { signature } = await walletClient.createSignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'self',
      data
    })
    if (!signature) throw new Error('Signature is undefined')
    const signatureObj = Signature.fromDER(signature)
    return toHex(signatureObj.toDER() as number[])
  } catch (error) {
    throw new Error(`signForSelf failed: ${(error as Error).message}`)
  }
}

/**
 * Verify a message signed by yourself (e.g., Alice verifies her own signature).
 */
export async function verifyForSelf(
  message: string,
  signature: string
): Promise<boolean> {
  // DONE: Implement the logic to verify a self-signed message with the following requirements:
  // 1. Fetch the public key using walletClient.getPublicKey with identityKey true.
  // 2. Validate the public key using validatePublicKey.
  // 3. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 4. Convert the signature hex string to a byte array using fromHex.
  // 5. Use walletClient.verifySignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'self', forSelf true, and the message and signature arrays.
  // 6. Return the valid property of the response.
  // 7. Handle errors by logging them and returning false.
  try {
    const { publicKey } = await walletClient.getPublicKey({ identityKey: true })
    validatePublicKey(publicKey)
    const data = Utils.toArray(message, 'utf8') as number[]
    const signatureArray = fromHex(signature)
    const { valid } = await walletClient.verifySignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'self',
      forSelf: true,
      data,
      signature: signatureArray
    })
    return valid
  } catch (error) {
    console.error('verifyForSelf failed:', error)
    return false
  }
}

/**
 * Sign a message for a friend (e.g., Alice signs for Bob).
 */
export async function signForFriend(
  message: string,
  friendIdentity: string
): Promise<string> {
  // DONE: Implement the logic to sign a message for a friend with the following requirements:
  // 1. Validate the friendIdentity using validatePublicKey.
  // 2. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 3. Use walletClient.createSignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty friendIdentity, and the message array as data.
  // 4. Check if the signature is defined; if not, throw an error.
  // 5. Parse the signature using Signature.fromDER and convert it to a hex string using toHex.
  // 6. Return the hex string.
  // 7. Handle errors by throwing them with a descriptive message.
  try {
    validatePublicKey(friendIdentity)
    const data = Utils.toArray(message, 'utf8') as number[]
    const { signature } = await walletClient.createSignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: friendIdentity,
      data
    })
    if (!signature) throw new Error('Signature is undefined')
    const signatureObj = Signature.fromDER(signature)
    return toHex(signatureObj.toDER() as number[])
  } catch (error) {
    throw new Error(`signForFriend failed: ${(error as Error).message}`)
  }
}

/**
 * Verify a message signed by a friend (e.g., Bob verifies Alice’s signature).
 */
export async function verifyFromFriend(
  message: string,
  signature: string,
  friendIdentity: string
): Promise<boolean> {
  // DONE: Implement the logic to verify a message signed by a friend with the following requirements:
  // 1. Validate the friendIdentity using validatePublicKey.
  // 2. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 3. Convert the signature hex string to a byte array using fromHex.
  // 4. Use walletClient.verifySignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty friendIdentity, forSelf false, and the message and signature arrays.
  // 5. Return the valid property of the response.
  // 6. Handle errors by logging them and returning false.
  try {
    validatePublicKey(friendIdentity)
    const data = Utils.toArray(message, 'utf8') as number[]
    const signatureArray = fromHex(signature)
    const { valid } = await walletClient.verifySignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: friendIdentity,
      forSelf: false,
      data,
      signature: signatureArray
    })
    return valid
  } catch (error) {
    console.error('verifyFromFriend failed:', error)
    return false
  }
}

/**
 * Sign a message for anyone.
 */
export async function signForAnyone(message: string): Promise<string> {
  // TODO: Implement the logic to sign a message for anyone with the following requirements:
  // 1. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 2. Use walletClient.createSignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'anyone', and the message array as data.
  // 3. Check if the signature is defined; if not, throw an error.
  // 4. Parse the signature using Signature.fromDER and convert it to a hex string using toHex.
  // 5. Return the hex string.
  // 6. Handle errors by throwing them with a descriptive message.
  try {
    const data = Utils.toArray(message, 'utf8') as number[]
    const { signature } = await walletClient.createSignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'anyone',
      data
    })
    if (!signature) throw new Error('Signature is undefined')
    const signatureObj = Signature.fromDER(signature)
    return toHex(signatureObj.toDER() as number[])
  } catch (error) {
    throw new Error(`signForAnyone failed: ${(error as Error).message}`)
  }
}

/**
 * Verify a message signed for anyone (e.g., verify a signature with the signer’s identity key).
 */
export async function verifyForAnyone(
  message: string,
  signature: string,
  signerIdentity: string
): Promise<boolean> {
  // TODO: Implement the logic to verify a message signed for anyone with the following requirements:
  // 1. Validate the signerIdentity using validatePublicKey.
  // 2. Convert the message to a UTF-8 byte array using Utils.toArray.
  // 3. Convert the signature hex string to a byte array using fromHex.
  // 4. Fetch the signer’s public key using walletClient.getPublicKey with counterparty signerIdentity, protocolID [0, 'cryption'], and keyID KEY  keyID KEY_ID.
  // 5. Validate the fetched public key using validatePublicKey.
  // 6. Use walletClient.verifySignature with protocolID [0, 'cryption'], keyID KEY_ID, counterparty signerIdentity, forSelf false, and the message and signature arrays.
  // 7. Return the valid property of the response.
  // 8. Handle errors by logging them and returning false.
  try {
    validatePublicKey(signerIdentity)
    const data = Utils.toArray(message, 'utf8') as number[]
    const signatureArray = fromHex(signature)
    const { publicKey } = await walletClient.getPublicKey({
      counterparty: signerIdentity,
      protocolID: [0, 'cryption'],
      keyID: KEY_ID
    })
    validatePublicKey(publicKey)
    const { valid } = await walletClient.verifySignature({
      protocolID: [0, 'cryption'],
      keyID: KEY_ID,
      counterparty: 'anyone',
      forSelf: true,
      data,
      signature: signatureArray
    })
    return valid
  } catch (error) {
    console.error('verifyForAnyone failed:', error)
    return false
  }
}

/**
 * Prove a certificate to a verifier (e.g., Alice proves to Bob).
 * Returns an object containing the proof (if successful) and the decoded certificate fields.
 */
export async function proveCertificate(
  certificate: Certificate | null,
  fieldsToReveal: string[],
  verifierIdentity: string
): Promise<{
  proof?: any
  decodedCertificateFields?: { [key: string]: string }[]
}> {
  // TODO: Implement the logic to prove a certificate with the following requirements:
  // 1. Validate the verifierIdentity using validatePublicKey.
  // 2. Fetch the current identity using walletClient.getPublicKey with identityKey true.
  // 3. Fetch the verifier’s public key using walletClient.getPublicKey with counterparty verifierIdentity, protocolID [0, 'cryption'], and keyID KEY_ID.
  // 4. Set default fields to ['email', 'issuer', 'subject'] if fieldsToReveal is empty.
  // 5. Fetch certificates with type 'ZW1haWxDZXJ0' using walletClient.listCertificates; if none found, fetch all certificates.
  // 6. Process certificate types using decryptCertificateType to identify emailCert certificates.
  // 7. Select a certificate: use the provided certificate, or the first emailCert certificate, or the first certificate with fields, or create a test certificate using createTestCertificate.
  // 8. Use walletClient.proveCertificate with the selected certificate, fieldsToReveal, verifier '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', and privileged false.
  // 9. If keyringForVerifier is available, create a VerifiableCertificate and decrypt fields using decryptFields with a ProtoWallet('anyone').
  // 10. Otherwise, decode fields using Utils.toArray and Utils.toUTF8, treating errors as plain strings.
  // 11. Return an object with decodedCertificateFields as an array of field objects.
  // 12. Handle errors by throwing them with a descriptive message.
  try {
    validatePublicKey(verifierIdentity)
    await walletClient.getPublicKey({ identityKey: true })
    await walletClient.getPublicKey({
      counterparty: verifierIdentity,
      protocolID: [0, 'cryption'],
      keyID: KEY_ID
    })

    if (fieldsToReveal.length === 0) {
      fieldsToReveal = ['email', 'issuer', 'subject']
    }

    let certResult = await walletClient.listCertificates({
      certifiers: [],
      types: ['ZW1haWxDZXJ0']
    }) as ListCertificatesResult

    if (!certResult.certificates || certResult.certificates.length === 0) {
      certResult = await walletClient.listCertificates({
        certifiers: [],
        types: []
      }) as ListCertificatesResult
    }

    const emailCerts = certResult.certificates.filter(cert => {
      const { isEmailCert } = decryptCertificateType(cert.type)
      return isEmailCert
    })

    let selectedCert: Certificate
    if (certificate) {
      selectedCert = certificate
    } else if (emailCerts.length > 0) {
      selectedCert = emailCerts[0]
    } else if (certResult.certificates.length > 0 && certResult.certificates[0].fields) {
      selectedCert = certResult.certificates[0]
    } else {
      selectedCert = await createTestCertificate()
    }

    // Filter fieldsToReveal to only include fields that exist in the certificate.
    // If none match (e.g. user typed field values instead of names), reveal all fields.
    const certFieldNames = Object.keys(selectedCert.fields)
    const validFields = fieldsToReveal.filter(f => certFieldNames.includes(f))
    fieldsToReveal = validFields.length > 0 ? validFields : certFieldNames

    const proof = await walletClient.proveCertificate({
      certificate: selectedCert as any,
      fieldsToReveal,
      verifier: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      privileged: false
    })

    const decodedCertificateFields: { [key: string]: string }[] = []

    if (proof.keyringForVerifier) {
      const protoWallet = new ProtoWallet('anyone')
      const verifiableCert = new VerifiableCertificate(
        selectedCert.type,
        selectedCert.serialNumber,
        selectedCert.subject,
        selectedCert.certifier,
        selectedCert.revocationOutpoint,
        selectedCert.fields,
        proof.keyringForVerifier,
        selectedCert.signature
      )
      const decryptedFields = await verifiableCert.decryptFields(protoWallet)
      for (const [key, value] of Object.entries(decryptedFields)) {
        decodedCertificateFields.push({ [key]: value })
      }
    } else {
      for (const [key, value] of Object.entries(selectedCert.fields)) {
        try {
          const decoded = Utils.toUTF8(Utils.toArray(value, 'base64'))
          decodedCertificateFields.push({ [key]: decoded })
        } catch {
          decodedCertificateFields.push({ [key]: value })
        }
      }
    }

    return { proof, decodedCertificateFields }
  } catch (error) {
    throw new Error(`proveCertificate failed: ${(error as Error).message}`)
  }
}

/**
 * Sign a transaction to redeem a PushDrop token (e.g., Alice redeems a token).
 */
export async function signTransaction(
  basket: string = 'signing demo'
): Promise<void> {
  // TODO: Implement the logic to sign a PushDrop transaction with the following requirements:
  try {
      // 1. Create a PushDrop instance with walletClient.
      const pushdrop = new PushDrop(walletClient)

  // 2. Create an initial locking script using pushdrop.lock with a sample script, protocolID [0, 'cryption'], keyID KEY_ID, counterparty 'anyone', and true.
    const sampleFields = [Utils.toArray('Hello, BSV!', 'utf8') as number[]]
    const lockingScript = await pushdrop.lock(
      sampleFields,
      [0, 'cryption'],
      KEY_ID,
      'anyone',
      true
    )
  // 3. Broadcast a transaction using walletClient.createAction with the locking script, 5 satoshis, and the basket name.
    const tx = await walletClient.createAction({
        outputs: [{
            lockingScript: lockingScript.toHex(),
            satoshis: 5,
            outputDescription: 'PushDrop token',
            basket
        }],
        description: 'PushDrop token creation'
        })
  // 4. Extract the txid and BEEF data from the transaction.
    if (!tx.txid || !tx.tx) throw new Error('Transaction creation failed')
    const txid = tx.txid
    const txBEEF = tx.tx
  // 5. Create a redeeming locking script using pushdrop.lock with a sample redeeming script.
    const redeemFields = [Utils.toArray('Redeeming token', 'utf8') as number[]]
    const redeemLockingScript = await pushdrop.lock(
      redeemFields,
      [0, 'cryption'],
      KEY_ID,
      'anyone',
      true
    )
  // 6. Create an unsigned transaction using walletClient.createAction with the BEEF data, input outpoint, and redeeming locking script.
    const unsignedTx = await walletClient.createAction({
      inputBEEF: txBEEF,
      inputs: [{
        outpoint: `${txid}.0`,
        inputDescription: 'PushDrop token redemption input',
        unlockingScriptLength: 108
      }],
      outputs: [{
        lockingScript: redeemLockingScript.toHex(),
        satoshis: 4,
        outputDescription: 'Redeemed token',
        basket
      }],
      description: 'PushDrop token redemption',
      options: { signAndProcess: false }
    })
    const signable = unsignedTx.signableTransaction
    if (!signable) throw new Error('Unsigned transaction creation failed')
  // 7. Create an unlocker using pushdrop.unlock and sign the transaction.

    const unlocker = pushdrop.unlock([0, 'cryption'], KEY_ID, 'anyone', 'all', false)
    const unlockingScript = await unlocker.sign(
      Transaction.fromBEEF(signable.tx as number[]),
      0
    )
  // 8. Submit the signed transaction using walletClient.signAction.
    await walletClient.signAction({
      reference: signable.reference,
      spends: {
        0: { unlockingScript: unlockingScript.toHex() }
      }
    })
  // 9. Verify the basket outputs using walletClient.listOutputs.
    const outputs = await walletClient.listOutputs({ basket })
    console.log(`Basket outputs: ${JSON.stringify(outputs)}`)
  // 10. Handle errors by throwing them with a descriptive message.
  } catch (error) {
    throw new Error(`signTransaction failed: ${(error as Error).message}`)
  }
}

/**
 * Extra Credit: Switch between Metanet client profiles (e.g., from "default" to "friend").
 */
export async function switchProfile(
  initialIdentity: string,
  targetProfile: string,
  timeoutMs: number = 30000
): Promise<string> {
  // DONE: Implement the logic to switch between Metanet client profiles for extra credit with the following requirements:
  // 1. Poll walletClient.getPublicKey({ identityKey: true }) every 1 second to detect a change from initialIdentity to a new identity.
  // 2. Continue polling until the identity changes or timeoutMs (default 30 seconds) is reached.
  // 3. If a new identity is detected, return the new identity’s public key.
  // 4. If the timeout is reached, throw an error with a descriptive message indicating the switch to targetProfile failed.
  // 5. Optionally, explore triggering a profile switch programmatically via Metanet client APIs (if supported) to automate the process.
  // Note: This function replaces the waitForWalletSwitch logic in index.tsx and App.tsx, enabling profile switching for Tests 3 and 7 within cryptionManager.ts.
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 200))
      try {
          const { publicKey } = await Promise.race([
              walletClient.getPublicKey({ identityKey: true }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('poll timeout')), 2000)
            )
        ])
        if (publicKey !== initialIdentity) {
            return publicKey
        }
    } catch {
        // wallet may be temporarily unavailable during profile switch, keep polling
    }
}
// 6. Handle errors by throwing them with a descriptive message.
  throw new Error(`switchProfile failed: Profile switch to "${targetProfile}" timed out after ${timeoutMs}ms`)
}

// Export WalletClient class, walletClient instance, and functions for use in index.tsx and App.tsx

export { WalletClient, walletClient }
