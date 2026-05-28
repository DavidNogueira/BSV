import {
  CreateActionArgs,
  CreateActionResult,
  WalletClient,
  WERR_REVIEW_ACTIONS
} from '@bsv/sdk'

export const createTransaction = async (): Promise<void> => {
  try {
    const lockingScript = import.meta.env.VITE_DEV_LOCKING_SCRIPT
    const walletClient = new WalletClient()
    const args: CreateActionArgs = {
      description: 'Create a transaction',
      outputs: [
        {
          lockingScript,
          satoshis: 5,
          outputDescription: 'Output with 5 satoshis and a locking script fifi8'
        }
        // DONE: Define the transaction output with the lockingScript, 5 satoshis, and an output description
      ]
    }
    const result: CreateActionResult = await walletClient.createAction(args)
    // DONE: Call walletClient.createAction with args, log the result, and handle the case where the transaction is undefined
    if (!result.tx) {
      throw new Error('Transaction creation failed: No transaction returned')
    }
    console.log('Transaction created successfully:', {
      result
    })
  } catch (error: unknown) {
    if (error instanceof WERR_REVIEW_ACTIONS) {
      console.error('Wallet threw WERR_REVIEW_ACTIONS:', {
        code: error.code,
        message: error.message,
        reviewActionResults: error.reviewActionResults,
        sendWithResults: error.sendWithResults,
        txid: error.txid,
        tx: error.tx,
        noSendChange: error.noSendChange
      })
    } else if (error instanceof Error) {
      console.error('Failed with error status:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      })
    } else {
      console.error('Failed with unknown error:', error)
    }
    throw error
  }
}
