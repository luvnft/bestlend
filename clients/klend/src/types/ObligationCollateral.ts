/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
export type ObligationCollateral = {
  depositReserve: web3.PublicKey
  depositedAmount: beet.bignum
  marketValueSf: beet.bignum
  padding: beet.bignum[] /* size: 10 */
}

/**
 * @category userTypes
 * @category generated
 */
export const obligationCollateralBeet =
  new beet.BeetArgsStruct<ObligationCollateral>(
    [
      ['depositReserve', beetSolana.publicKey],
      ['depositedAmount', beet.u64],
      ['marketValueSf', beet.u128],
      ['padding', beet.uniformFixedSizeArray(beet.u64, 10)],
    ],
    'ObligationCollateral'
  )
