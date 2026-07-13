import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import { Transaction, PushDrop, Utils } from '@bsv/sdk'
import uhrpTopicDocs from './UHRPTopicDocs.md.ts'

export default class UHRPTopicManager implements TopicManager {
  identifyNeededInputs?: ((beef: number[]) => Promise<Array<{ txid: string; outputIndex: number }>>) | undefined
  async getDocumentation(): Promise<string> {
    return uhrpTopicDocs
  }

  async getMetaData(): Promise<{ name: string; shortDescription: string; iconURL?: string; version?: string; informationURL?: string }> {
    return {
      name: 'Universal Hash Resolution Protocol',
      shortDescription: 'Manages UHRP content availability advertisements.'
    }
  }

  async identifyAdmissibleOutputs(beef: number[], previousCoins: number[]): Promise<AdmittanceInstructions> {
    try {
      console.log('previous UTXOs', previousCoins.length)
      const outputs: number[] = []
      const parsedTransaction = Transaction.fromBEEF(beef)

      for (const [i, output] of parsedTransaction.outputs.entries()) {
        try {
 
         // TODO 1: Decode UHRP token
         // TODO 2: Validate token fields
 
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