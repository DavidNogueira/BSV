import { WalletClient } from '@bsv/sdk'

const client = new WalletClient('auto', 'localhost')

export default async function checkForMetaNetClient() {
  try {
    const { network: result } = await client.getNetwork()
    if (result === 'mainnet' || result === 'testnet') {
      return 1
    } else {
      return -1
    }
  } catch (e) {
    return 0
  }
}
