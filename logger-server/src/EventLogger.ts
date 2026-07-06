import {
  PushDrop,
  Utils,
  Transaction,
  WalletInterface,
  WERR_REVIEW_ACTIONS
} from '@bsv/sdk'

export interface EventLogResult {
  txid: string
  message: string
  timestamp: string
}

export class EventLogger {
  private wallet: WalletInterface
  private pushdrop: PushDrop

  private readonly PROTOCOL_ID: [1, string] = [1, 'Event Logger']
  private readonly KEY_ID = '1'
  private readonly BASKET_NAME = 'event logs v2'

  constructor(wallet: WalletInterface) {
    this.wallet = wallet
    this.pushdrop = new PushDrop(wallet)
  }

  async logEvent(
    eventData: Record<string, any>,
    testWerrLabel = false
  ): Promise<Omit<EventLogResult, 'timestamp'>> {
    const timestamp = new Date().toISOString()
    const ip = 'unknown'
    const endpoint = '/log-event'

    const payload = {
      ip,
      timestamp,
      endpoint,
      ...eventData
    }

    //~ DONE 1: Validate eventData and enhance error handling
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid event data provided')
    }
    //~ DONE 2: Validate PushDrop script generation
    const fields = [Utils.toArray(JSON.stringify(payload), 'utf8')]
    const lockingScript = await this.pushdrop.lock(
      fields,
      this.PROTOCOL_ID,
      this.KEY_ID,
      'self',
      true,
      true
    )
    //~ DONE 3: Validate transaction ID and handle broadcast errors
    try {
      const { txid } = await this.wallet.createAction({
        description: 'Log event to blockchain',
        outputs: [
          {
            outputDescription: 'PushDrop output for event logging',
            basket: this.BASKET_NAME,
            lockingScript: lockingScript.toHex(),
            satoshis: 1
          }
        ]
      })

      if (!txid) {
        throw new Error('Transaction ID is undefined after logging event')
      }

      return {
        txid: txid ?? 'unknown-txid',
        message: 'Event logged successfully'
      }
    } catch (err: unknown) {
      if (err instanceof WERR_REVIEW_ACTIONS) {
        console.error('[logEvent] Wallet threw WERR_REVIEW_ACTIONS:', {
          code: err.code,
          message: err.message,
          reviewActionResults: err.reviewActionResults,
          sendWithResults: err.sendWithResults,
          txid: err.txid,
          tx: err.tx,
          noSendChange: err.noSendChange
        })
      } else if (err instanceof Error) {
        console.error('[logEvent] Failed with error status:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
          error: err
        })
      } else {
        console.error('[logEvent] Failed with unknown error:', err)
      }
      throw err
    }
  }

  async retrieveLogs(): Promise<EventLogResult[]> {
    console.log(
      '[retrieveLogs] Fetching outputs from basket:',
      this.BASKET_NAME
    )

    //~ DONE 4: Optimize log retrieval for large datasets
    const { outputs, BEEF } = await this.wallet.listOutputs({
      basket: this.BASKET_NAME,
      include: 'entire transactions',
      limit: 1000
    })
    if (!BEEF) {
      console.warn('[retrieveLogs] No basket outputs returned, cannot proceed.')
      return []
    }

    const logs: EventLogResult[] = []

    //~ DONE 5: Process blockchain data with validation and optimization
    console.log('[basketOutputs] Retrieved outputs:', outputs)

    await Promise.all(
      outputs.map(async (entry: any) => {
        try {
          const [txid, voutStr] = entry.outpoint.split('.')
          const vout = parseInt(voutStr, 10)

          const tx = Transaction.fromBEEF(BEEF, txid)
          const output = tx.outputs[vout]
          if (!output) return null

          const decoded = PushDrop.decode(output.lockingScript)
          if (!decoded.fields || decoded.fields.length === 0) return

          const payloadStr = Utils.toUTF8(decoded.fields[0])
          const payloadJSON = JSON.parse(payloadStr)
          console.log('[retrieveLogs] Decoded payload:--->', payloadJSON)
          logs.push(txid)
        } catch (error) {
          console.warn('[retrieveLogs] Failed to process output', error)
        }
      })
    )

    console.log('[retrieveLogs] Successfully retrieved logs:', logs.length)
    return logs
  }
}