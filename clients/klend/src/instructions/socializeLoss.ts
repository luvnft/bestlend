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
 * @category SocializeLoss
 * @category generated
 */
export type SocializeLossInstructionArgs = {
  liquidityAmount: beet.bignum
}
/**
 * @category Instructions
 * @category SocializeLoss
 * @category generated
 */
export const socializeLossStruct = new beet.BeetArgsStruct<
  SocializeLossInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['liquidityAmount', beet.u64],
  ],
  'SocializeLossInstructionArgs'
)
/**
 * Accounts required by the _socializeLoss_ instruction
 *
 * @property [**signer**] riskCouncil
 * @property [_writable_] obligation
 * @property [] lendingMarket
 * @property [_writable_] reserve
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category SocializeLoss
 * @category generated
 */
export type SocializeLossInstructionAccounts = {
  riskCouncil: web3.PublicKey
  obligation: web3.PublicKey
  lendingMarket: web3.PublicKey
  reserve: web3.PublicKey
  instructionSysvarAccount: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const socializeLossInstructionDiscriminator = [
  245, 75, 91, 0, 236, 97, 19, 3,
]

/**
 * Creates a _SocializeLoss_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SocializeLoss
 * @category generated
 */
export function createSocializeLossInstruction(
  accounts: SocializeLossInstructionAccounts,
  args: SocializeLossInstructionArgs,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = socializeLossStruct.serialize({
    instructionDiscriminator: socializeLossInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.riskCouncil,
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
    {
      pubkey: accounts.reserve,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.instructionSysvarAccount,
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
