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
 * @category RequestElevationGroup
 * @category generated
 */
export type RequestElevationGroupInstructionArgs = {
  elevationGroup: number
}
/**
 * @category Instructions
 * @category RequestElevationGroup
 * @category generated
 */
export const requestElevationGroupStruct = new beet.BeetArgsStruct<
  RequestElevationGroupInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['elevationGroup', beet.u8],
  ],
  'RequestElevationGroupInstructionArgs'
)
/**
 * Accounts required by the _requestElevationGroup_ instruction
 *
 * @property [**signer**] owner
 * @property [_writable_] obligation
 * @property [] lendingMarket
 * @category Instructions
 * @category RequestElevationGroup
 * @category generated
 */
export type RequestElevationGroupInstructionAccounts = {
  owner: web3.PublicKey
  obligation: web3.PublicKey
  lendingMarket: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const requestElevationGroupInstructionDiscriminator = [
  36, 119, 251, 129, 34, 240, 7, 147,
]

/**
 * Creates a _RequestElevationGroup_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category RequestElevationGroup
 * @category generated
 */
export function createRequestElevationGroupInstruction(
  accounts: RequestElevationGroupInstructionAccounts,
  args: RequestElevationGroupInstructionArgs,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = requestElevationGroupStruct.serialize({
    instructionDiscriminator: requestElevationGroupInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.owner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.obligation,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.lendingMarket,
      isWritable: false,
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