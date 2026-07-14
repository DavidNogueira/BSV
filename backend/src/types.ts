// TODO 1: Define UHRPRecord interface
export interface UHRPRecord {
  txid: string
  outputIndex: number
  uhrpUrl: string
  hostIdentityKey: string
  url: string
  expiryTime: number
  fileSize: number
  createdAt: Date
}

// TODO 2: Define UTXOReference interface
export interface UTXOReference {
  txid: string
  outputIndex: number
}
