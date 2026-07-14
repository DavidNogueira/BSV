import {
  PushDrop,
  Utils,
  Transaction,
  TopicBroadcaster,
  WalletClient,
  StorageUploader,
  StorageDownloader,
  StorageUtils,
  WERR_REVIEW_ACTIONS
} from '@bsv/sdk'
import { UploadableFile } from '@bsv/sdk/dist/types/src/storage/StorageUploader'

// Diagnostic circuit breaker: publishCommitment should only ever be in flight
// once per user click. If something calls it in a tight loop, fail fast
// instead of repeating the whole network flow thousands of times, and dump
// a stack trace once so we can see who the repeated caller actually is.
let recentCallTimestamps: number[] = []
let circuitBreakerTripped = false

export async function publishCommitment({
  url,
  hostingMinutes,
  address,
  serviceURL = 'https://nanostore.babbage.systems',
  testWerrLabel = false
}: {
  url: string
  hostingMinutes: number
  address: string
  serviceURL?: string
  testWerrLabel: boolean
}): Promise<string> {
  const now = Date.now()
  recentCallTimestamps.push(now)
  recentCallTimestamps = recentCallTimestamps.filter(t => now - t < 5000)
  if (recentCallTimestamps.length > 20) {
    if (!circuitBreakerTripped) {
      circuitBreakerTripped = true
      console.trace('publishCommitment called more than 20 times in 5 seconds -- circuit breaker tripped')
    }
    throw new Error('publishCommitment circuit breaker tripped: called too many times in a short window')
  }
  try {
    console.log('Starting publishCommitment')
    console.log('URL:', url)
    console.log('Service URL:', serviceURL)

    //~ DONE 1: Fetch file from URL
    const file = await fetch(url)
    //~ DONE 2: Initialize WalletClient and StorageUploader
    const walletClient = new WalletClient()

    const storageUploader = new StorageUploader({  
      storageURL: serviceURL,
      wallet: walletClient
    })
    //~ DONE 3: Convert file to uploadable format
    const arrayBuffer = await file.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)
    const contentLength = fileData.length

    const uploadableFile: UploadableFile = {
      data: fileData,
      type: file.headers.get('content-type') || 'application/octet-stream'
    }
    //~ DONE 4: Upload file and get UHRP URL
    let UHRPURL
    try {
      UHRPURL = await storageUploader.publishFile({
        file: uploadableFile,
        retentionPeriod: hostingMinutes // nanostore's retentionPeriod is already in minutes
      })
    } catch (error) {
      // publishFile's internal /quote + /upload calls swallow the server's real
      // error description, reporting only a generic HTTP status. /quote doesn't
      // require payment and performs the same fileSize/retentionPeriod
      // validation, so re-querying it directly surfaces the actual reason.
      let detail = 'no additional detail available'
      try {
        const quoteResponse = await fetch(`${serviceURL}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileSize: contentLength, retentionPeriod: hostingMinutes })
        })
        const quoteBody = await quoteResponse.text()
        detail = `HTTP ${quoteResponse.status}: ${quoteBody}`
      } catch (diagError) {
        detail = diagError instanceof Error ? diagError.message : String(diagError)
      }
      throw new Error(`${(error as Error).message} (root cause from ${serviceURL}/quote -- ${detail})`)
    }
    console.log('Generated UHRP URL:', UHRPURL)

    //~ DONE 5: Generate UHRP hash
    const UHRHash = StorageUtils.getHashFromURL(UHRPURL.uhrpURL)
    console.log('Generated UHR Hash:', UHRHash)

    //~ DONE 6: Calculate expiry time
    const expiryTime = Math.floor(Date.now() / 1000) + hostingMinutes * 60

    // Resolve the real, publicly-advertised HTTP URL for this file. nanostore
    // publishes its own advertisement on the public ls_uhrp network, which can
    // lag slightly behind the upload finishing, so retry with backoff.
    const downloader = new StorageDownloader()
    let resolvedURL: string | undefined
    const maxAttempts = 8
    for (let attempt = 0; attempt < maxAttempts && resolvedURL === undefined; attempt++) {
      if (attempt > 0) {
        const waitMs = Math.min(attempt * 2000, 8000)
        console.log(`Advertisement not yet propagated, retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxAttempts})...`)
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
      const candidateURLs = await downloader.resolve(UHRPURL.uhrpURL)
      if (candidateURLs.length > 0) {
        resolvedURL = candidateURLs[0]
      }
    }
    if (resolvedURL === undefined) {
      throw new Error('Could not resolve a public HTTP URL for the uploaded file yet. Please try again shortly.')
    }

    //~ DONE 7: Create and broadcast UHRP token
    const pushDrop = new PushDrop(walletClient)
    const protocolID: [0 | 1 | 2, string] = [1, 'tm uhrp']
    const keyID = '1'
    const counterparty = 'self'
    // The address field must match the actual locking public key so the
    // UHRPTopicManager's address/locking-key consistency check passes.
    const { publicKey: addressHex } = await walletClient.getPublicKey({
      protocolID,
      keyID,
      counterparty
    })
    const lockingScript = await pushDrop.lock(
      [
        Utils.toArray(addressHex, 'hex'),
        UHRHash,
        Utils.toArray(resolvedURL),
        new Utils.Writer().writeVarIntNum(expiryTime).toArray(),
        new Utils.Writer().writeVarIntNum(contentLength).toArray()
      ],
      protocolID,
      keyID,
      counterparty
    )

    const tx = await walletClient.createAction({
      description: 'Create UHRP Token',
      outputs: [
        {
          outputDescription: 'UHRP Token Output',
          lockingScript: lockingScript.toHex(),
          satoshis: 1
        }
      ]
    })

    const broadcaster = new TopicBroadcaster(['tm_uhrp'], {
      networkPreset: 'local'
    })
    const atomicTx = tx.tx
    if (!atomicTx) {
      throw new Error('Transaction data is unavailable')
    }

    const sentTx = Transaction.fromAtomicBEEF(atomicTx)
    const broadcastResult = await broadcaster.broadcast(sentTx)
    if (broadcastResult.status === 'error') {
      throw new Error(`Broadcast to tm_uhrp failed: ${broadcastResult.code} -- ${broadcastResult.description}`)
    }

    console.log('Transaction created and broadcasted:', sentTx.id('hex'))
    return `${UHRPURL.uhrpURL}`
  } catch (error) {
    console.error('Error creating commitment:', error)
    throw error
  }
}
