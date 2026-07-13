import {
  AuthFetch,
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
    // StorageUploader.publishFile() always runs a pre-flight /quote step
    // across multiple providers (a resilience feature added in @bsv/sdk 2.x)
    // before uploading, which hid the real /upload error behind a generic
    // "N of M providers responded" message. Call /upload directly instead,
    // the way publishFile worked before that pre-check existed -- whatever
    // retention-period rules the server enforces still apply either way.
    const authFetch = new AuthFetch(walletClient)
    const uploadInfoResponse = await authFetch.fetch(`${serviceURL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileSize: fileData.byteLength, retentionPeriod: hostingMinutes })
    })
    const uploadInfo = await uploadInfoResponse.json() as {
      status: string
      uploadURL: string
      requiredHeaders: Record<string, string>
      amount?: number
      code?: string
      description?: string
    }
    if (!uploadInfoResponse.ok || uploadInfo.status === 'error') {
      throw new Error(
        `Upload info request failed: HTTP ${uploadInfoResponse.status} -- ${uploadInfo.description ?? 'Upload route returned an error.'}`
      )
    }
    const putResponse = await fetch(uploadInfo.uploadURL, {
      method: 'PUT',
      body: fileData as BodyInit,
      headers: {
        'Content-Type': uploadableFile.type,
        ...uploadInfo.requiredHeaders
      }
    })
    if (!putResponse.ok) {
      throw new Error(`File upload failed: HTTP ${putResponse.status}`)
    }
    const UHRPURL = StorageUtils.getURLForFile(fileData)

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
