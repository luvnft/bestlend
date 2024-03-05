/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'
export type ScopeConfiguration = {
  priceFeed: web3.PublicKey
  priceChain: number[] /* size: 4 */
  twapChain: number[] /* size: 4 */
}

/**
 * @category userTypes
 * @category generated
 */
export const scopeConfigurationBeet =
  new beet.BeetArgsStruct<ScopeConfiguration>(
    [
      ['priceFeed', beetSolana.publicKey],
      ['priceChain', beet.uniformFixedSizeArray(beet.u16, 4)],
      ['twapChain', beet.uniformFixedSizeArray(beet.u16, 4)],
    ],
    'ScopeConfiguration'
  )
