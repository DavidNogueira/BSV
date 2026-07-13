import {
  PushDrop,
  Utils,
  Transaction,
  TopicBroadcaster,
  WalletClient,
  StorageUploader,
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
      retentionPeriod: hostingMinutes * 60 // Convert minutes to seconds
    })
    console.log('Generated UHRP URL:', UHRPURL)

    //~ DONE 5: Generate UHRP hash
    const UHRHash = StorageUtils.getHashFromURL(UHRPURL.uhrpURL)
    console.log('Generated UHR Hash:', UHRHash)

    //~ DONE 6: Calculate expiry time
    const expiryTime = Math.floor(Date.now() / 1000) + hostingMinutes * 60

    //~ DONE 7: Create and broadcast UHRP token
    const pushDrop = new PushDrop(walletClient)
    const lockingScript = await pushDrop.lock(
      [
        // Utils.toArray(UHRHash),
        Utils.toArray('1UHRPYnMHPuQ5Tgb3AF8JXqwKkmZVy5hG'),
        UHRHash,
        Utils.toArray(UHRPURL.uhrpURL),
        Utils.toArray(expiryTime.toString()),
        Utils.toArray(contentLength.toString())
      ],
      [1, 'tm uhrp'],
      '1',
      'self'
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

    console.log('Transaction created and broadcasted:', sentTx.toHex())
    return `${UHRPURL.uhrpURL}`
  } catch (error) {
    console.error('Error creating commitment:', error)
    throw error
  }
}
