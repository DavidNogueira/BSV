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
    const UHRPURL = await storageUploader.publishFile({
      file: uploadableFile,
      retentionPeriod: hostingMinutes // nanostore's retentionPeriod is already in minutes
    })
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
    for (let attempt = 0; attempt < 5 && resolvedURL === undefined; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
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
    await broadcaster.broadcast(sentTx)

    console.log('Transaction created and broadcasted:', sentTx.id('hex'))
    return `${UHRPURL.uhrpURL}`
  } catch (error) {
    console.error('Error creating commitment:', error)
    throw error
  }
}
