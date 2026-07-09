import {
  PushDrop,
  Utils,
  WalletClient,
  StorageUploader,
  StorageUtils,
  WERR_REVIEW_ACTIONS,
  WalletProtocol
} from '@bsv/sdk'

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

    // TODO 1: Fetch file from URL
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)

    // TODO 2: Initialize WalletClient and StorageUploader
    const walletClient = new WalletClient()
    await walletClient.connectToSubstrate()
    const storageUploader = new StorageUploader({
      wallet: walletClient,
      storageURL: serviceURL
    })

    // TODO 3: Convert file to uploadable format
    const uploadableFile = {
      data: fileData,
      type: 'application/octet-stream'
    }

    // TODO 4: Upload file and get UHRP URL
    const uploadResult = await storageUploader.publishFile({
      file: uploadableFile,
      retentionPeriod: hostingMinutes
    })
    const UHRPURL = uploadResult.uhrpURL

    // TODO 5: Generate UHRP hash
    const UHRHash = StorageUtils.getHashFromURL(UHRPURL)

    // TODO 6: Calculate expiry time
    const { expiryTime } = await storageUploader.findFile(UHRPURL)

    // TODO 7: Create and broadcast UHRP token
    // This is our own on-chain commitment receipt, not the UHRP host advertisement
    // itself -- nanostore already broadcasts that advertisement server-side as
    // part of the paid /upload request, which is what makes the file resolvable
    // through StorageDownloader/ls_uhrp. This token just records, from the
    // user's own wallet, that they committed to hosting this URL/hash/expiry.
    const pushDrop = new PushDrop(walletClient)
    const protocolID: WalletProtocol = [2, 'file commitment']
    const keyID = '1'
    const fields = [
      Utils.toArray(UHRPURL, 'utf8'),
      UHRHash,
      Utils.toArray(String(expiryTime), 'utf8'),
      Utils.toArray(serviceURL, 'utf8')
    ]
    const lockingScript = await pushDrop.lock(fields, protocolID, keyID, address)

    let createActionResult: { txid?: string }
    try {
      createActionResult = await walletClient.createAction({
        description: 'File storage commitment',
        outputs: [{
          lockingScript: lockingScript.toHex(),
          satoshis: 1,
          outputDescription: 'File storage commitment receipt',
          basket: 'file commitments'
        }],
        options: {
          acceptDelayedBroadcast: !testWerrLabel
        }
      })
    } catch (error) {
      if (error instanceof WERR_REVIEW_ACTIONS) {
        console.warn('Action requires review, proceeding with returned transaction:', error.reviewActionResults)
        createActionResult = { txid: error.txid }
      } else {
        throw error
      }
    }

    console.log('Commitment transaction created:', createActionResult.txid)
    return UHRPURL
  } catch (error) {
    console.error('Error creating commitment:', error)
    throw error
  }
}
