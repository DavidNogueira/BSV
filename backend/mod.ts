// TODO 1: Export UHRPLookupServiceFactory for ls_uhrp
export { default as UHRPLookupServiceFactory } from './src/lookup-services/UHRPLookupServiceFactory.js'

// TODO 2: Export UHRPTopicManager for tm_uhrp
export { default as UHRPTopicManager } from './src/topic-managers/UHRPTopicManager.js'

// TODO 3: Export types for UHRPRecord and UTXOReference
export type { UHRPRecord, UTXOReference } from './src/types.js'

// TODO 4: Export service metadata constant
export const SERVICE_METADATA = {
  tm_uhrp: {
    name: 'Universal Hash Resolution Protocol',
    shortDescription: 'Manages UHRP content availability advertisements.'
  },
  ls_uhrp: {
    name: 'UHRP Lookup Service',
    shortDescription: 'Lookup Service for User file hosting commitment tokens'
  }
}
