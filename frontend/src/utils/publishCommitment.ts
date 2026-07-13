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
    console.log('Hosting minutes:', hostingMinutes)

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
    let uploadResult
    try {
      uploadResult = await storageUploader.publishFile({
        file: uploadableFile,
        retentionPeriod: hostingMinutes
      })
    } catch (error) {
      // StorageUploader.publishFile's pre-flight /quote step swallows the
      // real per-provider error (HTTP status, body, network/CORS failure)
      // and reports only "N of M providers responded". Re-query the quote
      // endpoint ourselves so the actual cause reaches the user/console.
      let quoteDetail = 'no additional detail available'
      try {
        const quoteResponse = await fetch(`${serviceURL}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileSize: fileData.byteLength, retentionPeriod: hostingMinutes })
        })
        const quoteBody = await quoteResponse.text()
        quoteDetail = `HTTP ${quoteResponse.status}: ${quoteBody}`
      } catch (quoteError) {
        quoteDetail = quoteError instanceof Error ? quoteError.message : String(quoteError)
      }
      throw new Error(`${(error as Error).message} (root cause from ${serviceURL}/quote -- ${quoteDetail})`)
    }
    const UHRPURL = uploadResult.uhrpURL

    // TODO 5: Generate UHRP hash
    const UHRHash = StorageUtils.getHashFromURL(UHRPURL)

    // TODO 6: Calculate expiry time
    // Right after a paid upload, the storage host's own /find route can
    // briefly 500 before the new file finishes indexing server-side, so
    // retry a few times with backoff instead of failing on the first miss.
    let expiryTime: number | undefined
    let findFileError: unknown
    for (let attempt = 0; attempt < 5 && expiryTime === undefined; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
      try {
        expiryTime = (await storageUploader.findFile(UHRPURL)).expiryTime
      } catch (error) {
        findFileError = error
      }
    }
    if (expiryTime === undefined) {
      throw findFileError instanceof Error
        ? findFileError
        : new Error('Failed to retrieve file metadata after upload.')
    }

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
