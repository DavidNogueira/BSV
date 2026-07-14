import { AdmissionMode, LookupService, OutputAdmittedByTopic, OutputSpent, SpendNotificationMode } from '@bsv/overlay'
import { PushDrop, Utils, StorageUtils } from '@bsv/sdk'
import { UHRPRecord, UTXOReference } from '../types.js'
import { Db, Collection } from 'mongodb'
import uhrpLookupDocs from './UHRPLookupDocs.md.ts'

class UHRPLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'
  records: Collection<UHRPRecord>

  constructor (db: Db) {
    this.records = db.collection<UHRPRecord>('uhrp')
  }

  async getDocumentation (): Promise<string> {
    return uhrpLookupDocs
  }

  async getMetaData (): Promise<{ name: string, shortDescription: string, iconURL?: string, version?: string, informationURL?: string }> {
    return {
      name: 'UHRP Lookup Service',
      shortDescription: 'Lookup Service for User file hosting commitment tokens'
    }
  }

  async outputAdmittedByTopic (payload: OutputAdmittedByTopic): Promise<void> {
    if (payload.mode !== 'locking-script') throw new Error('Invalid payload')
    const { topic, txid, outputIndex, lockingScript } = payload
    if (topic !== 'tm_uhrp') return

    // TODO 1: Decode UHRP token fields
    const { fields, lockingPublicKey } = PushDrop.decode(lockingScript)
    const [addressField, hashField, urlField, expiryField, sizeField] = fields
    if (addressField === undefined || hashField === undefined || urlField === undefined ||
      expiryField === undefined || sizeField === undefined) {
      console.error('UHRP token is missing one or more required fields, skipping', txid, outputIndex)
      return
    }

    // TODO 2: Store UHRP fields in MongoDB
    const uhrpUrl = StorageUtils.getURLForHash(hashField)
    const url = Utils.toUTF8(urlField)
    const expiryTime = new Utils.Reader(expiryField).readVarIntNum()
    const fileSize = new Utils.Reader(sizeField).readVarIntNum()
    const hostIdentityKey = Utils.toHex(addressField)
    if (hostIdentityKey !== lockingPublicKey.toString()) {
      console.error('UHRP token address field does not match the locking public key, skipping', txid, outputIndex)
      return
    }

    await this.records.insertOne({
      txid,
      outputIndex,
      uhrpUrl,
      hostIdentityKey,
      url,
      expiryTime,
      fileSize,
      createdAt: new Date()
    })
  }

  async outputSpent (payload: OutputSpent): Promise<void> {
    if (payload.mode !== 'none') throw new Error('Invalid payload')
    const { topic, txid, outputIndex } = payload
    if (topic !== 'tm_uhrp') return

    // TODO 3: Remove spent commitment
    await this.records.deleteOne({ txid, outputIndex })
  }

  async outputEvicted (txid: string, outputIndex: number): Promise<void> {
    // TODO 4: Remove evicted commitment
    await this.records.deleteOne({ txid, outputIndex })
  }

  async lookup ({ query }: any): Promise<UTXOReference[]> {
    // TODO 5: Validate query
    if (query === null || typeof query !== 'object') {
      throw new Error('A valid query must be provided')
    }
    const { txid, outputIndex, uhrpUrl, expiryTime, hostIdentityKey } = query as {
      txid?: string
      outputIndex?: number
      uhrpUrl?: string
      expiryTime?: number
      hostIdentityKey?: string
    }
    if (txid === undefined && uhrpUrl === undefined && expiryTime === undefined && hostIdentityKey === undefined) {
      throw new Error('At least one of txid, uhrpUrl, expiryTime, or hostIdentityKey must be provided')
    }
    if (txid !== undefined && typeof outputIndex !== 'number') {
      throw new Error('outputIndex must be provided alongside txid')
    }

    // TODO 6: Handle query
    const filter: Record<string, unknown> = {}
    if (txid !== undefined) {
      filter.txid = txid
      filter.outputIndex = outputIndex
    }
    if (uhrpUrl !== undefined) {
      filter.uhrpUrl = uhrpUrl
    }
    if (expiryTime !== undefined) {
      filter.expiryTime = { $gte: expiryTime }
    }
    if (hostIdentityKey !== undefined) {
      filter.hostIdentityKey = hostIdentityKey
    }

    const results = await this.records.find(filter).toArray()
    return results.map(record => ({
      txid: record.txid,
      outputIndex: record.outputIndex
    }))
  }
}

export default (db: Db): UHRPLookupService => new UHRPLookupService(db)
