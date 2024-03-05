export * from './LendingMarket'
export * from './Obligation'
export * from './ReferrerState'
export * from './ReferrerTokenState'
export * from './Reserve'
export * from './ShortUrl'
export * from './UserMetadata'

import { LendingMarket } from './LendingMarket'
import { Obligation } from './Obligation'
import { ReferrerTokenState } from './ReferrerTokenState'
import { UserMetadata } from './UserMetadata'
import { ReferrerState } from './ReferrerState'
import { ShortUrl } from './ShortUrl'
import { Reserve } from './Reserve'

export const accountProviders = {
  LendingMarket,
  Obligation,
  ReferrerTokenState,
  UserMetadata,
  ReferrerState,
  ShortUrl,
  Reserve,
}
