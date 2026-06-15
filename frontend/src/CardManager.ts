import {
  WalletClient,
  PushDrop,
  Utils,
  LockingScript,
  Transaction,
  WalletProtocol,
  WERR_REVIEW_ACTIONS
} from '@bsv/sdk'
import { v4 as uuidv4 } from 'uuid'

export interface CardData {
  name: string
  description: string
  rarity: string
  ability: string
  history: string
  sats: number
  txid: string
  outputIndex: number
  outputScript: string
  keyID: string
  envelope?: any
}

const PROTOCOL_ID: WalletProtocol = [1, 'card collectibles']
const BASKET_NAME = 'cards'

const walletClient = new WalletClient('json-api', 'localhost')
const pushdrop = new PushDrop(walletClient)

function generateUniqueKeyID(): string {
  return uuidv4()
}

export async function createCard(
  card: Omit<
    CardData,
    'txid' | 'outputIndex' | 'outputScript' | 'envelope' | 'keyID'
  >,
  testWerrLabel = false
): Promise<void> {
  // TODO: Implement the logic to create a collectible card token + metadata with required fields: name, description, rarity, ability, history, sats:
  // 1. Generate a unique keyID using generateUniqueKeyID.
  // 2. Create a JSON object with card attributes (name, description, rarity, ability) and convert it to a UTF-8 array using Utils.toArray.
  // 3. Use pushdrop.lock to create a locking script with the encoded attributes, PROTOCOL_ID, keyID, 'self', and true for locking.
  // 4. Call walletClient.createAction to create a transaction with the locking script, card.sats, BASKET_NAME, and custom instructions (JSON.stringify({ keyID, history })).
  // 5. Set options: randomizeOutputs: false, acceptDelayedBroadcast: false.
  // 6. Handle errors, including WERR_REVIEW_ACTIONS, and log detailed error information.
  // Lab L-8 rule: store history in customInstructions (wallet metadata). The on-chain PushDrop payload encodes only { name, description, rarity, ability } and acts as the anchor for the card.
}

export async function loadCards(): Promise<CardData[]> {
  // TODO: Implement the logic to load collectible card tokens with fields: name, description, rarity, ability, history, sats:
  // 1. Use walletClient.listOutputs to fetch outputs from BASKET_NAME, including entire transactions and custom instructions.
  // 2. For each output, extract txid and outputIndex from the outpoint.
  // 3. Parse the transaction from BEEF data and get the locking script.
  // 4. Decode the PushDrop script to extract the encoded card attributes (JSON string).
  // 5. Parse the JSON string to retrieve name, description, rarity, and ability.
  // 6. Extract keyID and history from customInstructions (if available).
  // 7. Build a CardData object for each valid output, including satoshis, txid, outputIndex, outputScript, keyID, and history.
  // 8. Filter out invalid entries and return the list of CardData objects.
  return []
}

export async function redeemCard(card: CardData): Promise<void> {
  // TODO: Implement the logic to redeem a collectible card token:
  // 1. Fetch BEEF data from walletClient.listOutputs for BASKET_NAME, including entire transactions.
  // 2. Parse the card’s outputScript into a LockingScript.
  // 3. Create an unlocker with pushdrop.unlock using PROTOCOL_ID, card.keyID, 'self', 'all', false, card.sats, and the parsed script.
  // 4. Call walletClient.createAction with the card’s outpoint, unlockingScriptLength: 73, and options: randomizeOutputs: false, acceptDelayedBroadcast: false.
  // 5. Sign the transaction using unlocker.sign and submit it via walletClient.signAction.
  // 6. Handle errors, including WERR_REVIEW_ACTIONS, and log detailed error information.
}
