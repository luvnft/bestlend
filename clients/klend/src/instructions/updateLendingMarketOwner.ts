/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category UpdateLendingMarketOwner
 * @category generated
 */
export const updateLendingMarketOwnerStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'UpdateLendingMarketOwnerInstructionArgs'
)
/**
 * Accounts required by the _updateLendingMarketOwner_ instruction
 *
 * @property [**signer**] lendingMarketOwnerCached
 * @property [_writable_] lendingMarket
 * @category Instructions
 * @category UpdateLendingMarketOwner
 * @category generated
 */
export type UpdateLendingMarketOwnerInstructionAccounts = {
  lendingMarketOwnerCached: web3.PublicKey
  lendingMarket: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateLendingMarketOwnerInstructionDiscriminator = [
  118, 224, 10, 62, 196, 230, 184, 89,
]

/**
 * Creates a _UpdateLendingMarketOwner_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category UpdateLendingMarketOwner
 * @category generated
 */
export function createUpdateLendingMarketOwnerInstruction(
  accounts: UpdateLendingMarketOwnerInstructionAccounts,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = updateLendingMarketOwnerStruct.serialize({
    instructionDiscriminator: updateLendingMarketOwnerInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.lendingMarketOwnerCached,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.lendingMarket,
      isWritable: true,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}