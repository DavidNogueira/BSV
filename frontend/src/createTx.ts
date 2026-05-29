import {
  CreateActionArgs,
  CreateActionResult,
  WalletClient,
  WERR_REVIEW_ACTIONS
} from '@bsv/sdk'

export const createTransaction = async (): Promise<void> => {
  try {
    const lockingScript =
      '2102aaa7a5a2e386840889732be8d8264d42198f116903ed9f8f2cc9763c0e9958acac0e4d7920666972737420746f6b656e0849276d204d6174744630440220187800c3732512ef3d3ccdf741966b45f4251f879ac933160837a03d1c98a420022064c4d3fb3c07b12c47aae5baef7890e996ffa680e32fb8aa678c7f06ff0d37bd6d75'
    const walletClient = new WalletClient()
    //? We use this method to list actions and calculate the total satoshis from those actions before creating a new transaction.
    //? This is useful for debugging and ensuring that we have the correct inputs for our transaction.
    const listedActions = await walletClient.listActions({
      limit: 10000, //* TODO TOME: investigate if we can set the "limit" as unlimited
      labels: []
    })
    //? we can log the listed actions to see what inputs are available for our transaction creation and to verify that the wallet is returning the expected data.
    console.log(listedActions)
    //? Calculate the total satoshis from the listed actions and log it for debugging purposes
    const totalSatoshis = listedActions.actions.reduce(
      (total, action) => total + action.satoshis,
      0
    )
    //? Log the total satoshis to verify that we have the correct amount of inputs for our transaction creation
    console.log('Total satoshis from listed actions:', totalSatoshis)

    //? Define a potential fee for the transaction to ensure that we have enough funds to cover the transaction costs. This is important for debugging and preventing transaction creation failures due to insufficient funds.
    //* TODO TOME: Define a potential fee for the transaction to ensure that we have enough funds to cover the transaction costs.
    //* This is important for debugging and preventing transaction creation failures due to insufficient funds.
    const potentialFee = 0 //* TODO TOME: Check if we can see the fee before the transaction is created
    const outputSatoshis = 5
    const args: CreateActionArgs = {
      description: 'Create a transaction',
      //~ DONE: Define the transaction output with the lockingScript, 5 satoshis, and an output description
      outputs: [
        {
          lockingScript,
          satoshis: outputSatoshis,
          outputDescription: 'Output with 5 satoshis and a locking script'
        }
      ]
    }
    //~ DONE: Call walletClient.createAction with args, log the result, and handle the case where the transaction is undefined
    const result: CreateActionResult = await walletClient.createAction(args)
    if (totalSatoshis - potentialFee < outputSatoshis) {
      throw new Error('Transaction creation failed: Insufficient funds')
    }

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
