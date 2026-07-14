import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import { Transaction, PushDrop, Utils } from '@bsv/sdk'
import uhrpTopicDocs from './UHRPTopicDocs.md.ts'

export default class UHRPTopicManager implements TopicManager {
  identifyNeededInputs?: ((beef: number[]) => Promise<Array<{ txid: string, outputIndex: number }>>) | undefined
  async getDocumentation (): Promise<string> {
    return uhrpTopicDocs
  }

  async getMetaData (): Promise<{ name: string, shortDescription: string, iconURL?: string, version?: string, informationURL?: string }> {
    return {
      name: 'Universal Hash Resolution Protocol',
      shortDescription: 'Manages UHRP content availability advertisements.'
    }
  }

  async identifyAdmissibleOutputs (beef: number[], previousCoins: number[]): Promise<AdmittanceInstructions> {
    try {
      console.log('previous UTXOs', previousCoins.length)
      const outputs: number[] = []
      const parsedTransaction = Transaction.fromBEEF(beef)

      for (const [i, output] of parsedTransaction.outputs.entries()) {
        try {
          // TODO 1: Decode UHRP token
          const { fields, lockingPublicKey } = PushDrop.decode(output.lockingScript)
          const [addressField, hashField, urlField, expiryField, sizeField] = fields

          // TODO 2: Validate token fields
          if (addressField === undefined || hashField === undefined || urlField === undefined ||
            expiryField === undefined || sizeField === undefined) {
            throw new Error('UHRP token is missing one or more required fields')
          }
          if (Utils.toHex(addressField) !== lockingPublicKey.toString()) {
            throw new Error('UHRP token address field does not match the locking public key')
          }
          if (hashField.length !== 32) {
            throw new Error('UHRP token hash must be 32 bytes')
          }
          const url = Utils.toUTF8(urlField)
          const parsedURL = new URL(url)
          if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
            throw new Error('UHRP token URL must be http or https')
          }
          const expiryTime = new Utils.Reader(expiryField).readVarIntNum()
          if (!Number.isFinite(expiryTime) || expiryTime <= Math.floor(Date.now() / 1000)) {
            throw new Error('UHRP token has already expired')
          }
          const fileSize = new Utils.Reader(sizeField).readVarIntNum()
          if (!Number.isFinite(fileSize) || fileSize <= 0) {
            throw new Error('UHRP token file size must be a positive integer')
          }

          outputs.push(i)
        } catch (error) {
          console.error('Error with output', i, error)
        }
      }

      if (outputs.length === 0) {
        throw new Error('This transaction does not publish a valid UHRP token!')
      }

      return {
        coinsToRetain: previousCoins,
        outputsToAdmit: outputs
      }
    } catch (error) {
      return {
        coinsToRetain: [],
        outputsToAdmit: []
      }
    }
  }
}
