declare module '@bsv/sdk/storage/StorageUploader' {
  import { WalletClient } from '@bsv/sdk'

  interface StorageUploaderOptions {
    storageURL: string
    wallet: WalletClient
  }

  interface ListUploadsResult {
    uhrpUrl: string
    expiryTime: number
  }

  interface FindFileData {
    name: string
    size: string
    mimeType: string
    expiryTime: number
  }

  interface RenewFileResult {
    status: string
    prevExpiryTime?: number
    newExpiryTime?: number
    amount?: number
  }
  interface UploadFileResult {
    published: boolean
    uhrpURL: string
  }
  export class StorageUploader {
    constructor(options: StorageUploaderOptions)
    listUploads(): Promise<ListUploadsResult[]>
    publishFile(params: {
      file: UploadableFile
      retentionPeriod: number
    }): Promise<UploadFileResult>
    renewFile(
      uhrpURL: string,
      additionalMinutes: number
    ): Promise<RenewFileResult>
    findFile(uhrpUrl: string): Promise<FindFileData>
  }
}
