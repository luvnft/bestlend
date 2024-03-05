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
 * @category InitLendingMarket
 * @category generated
 */
export type InitLendingMarketInstructionArgs = {
  quoteCurrency: number[] /* size: 32 */
}
/**
 * @category Instructions
 * @category InitLendingMarket
 * @category generated
 */
export const initLendingMarketStruct = new beet.BeetArgsStruct<
  InitLendingMarketInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['quoteCurrency', beet.uniformFixedSizeArray(beet.u8, 32)],
  ],
  'InitLendingMarketInstructionArgs'
)
/**
 * Accounts required by the _initLendingMarket_ instruction
 *
 * @property [_writable_, **signer**] lendingMarketOwner
 * @property [_writable_] lendingMarket
 * @property [] lendingMarketAuthority
 * @category Instructions
 * @category InitLendingMarket
 * @category generated
 */
export type InitLendingMarketInstructionAccounts = {
  lendingMarketOwner: web3.PublicKey
  lendingMarket: web3.PublicKey
  lendingMarketAuthority: web3.PublicKey
  systemProgram?: web3.PublicKey
  rent?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initLendingMarketInstructionDiscriminator = [
  34, 162, 116, 14, 101, 137, 94, 239,
]

/**
 * Creates a _InitLendingMarket_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitLendingMarket
 * @category generated
 */
export function createInitLendingMarketInstruction(
  accounts: InitLendingMarketInstructionAccounts,
  args: InitLendingMarketInstructionArgs,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = initLendingMarketStruct.serialize({
    instructionDiscriminator: initLendingMarketInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.lendingMarketOwner,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.lendingMarket,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.lendingMarketAuthority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
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