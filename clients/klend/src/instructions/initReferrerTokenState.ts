/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'

/**
 * @category Instructions
 * @category InitReferrerTokenState
 * @category generated
 */
export type InitReferrerTokenStateInstructionArgs = {
  referrer: web3.PublicKey
}
/**
 * @category Instructions
 * @category InitReferrerTokenState
 * @category generated
 */
export const initReferrerTokenStateStruct = new beet.BeetArgsStruct<
  InitReferrerTokenStateInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['referrer', beetSolana.publicKey],
  ],
  'InitReferrerTokenStateInstructionArgs'
)
/**
 * Accounts required by the _initReferrerTokenState_ instruction
 *
 * @property [_writable_, **signer**] payer
 * @property [] lendingMarket
 * @property [] reserve
 * @property [_writable_] referrerTokenState
 * @category Instructions
 * @category InitReferrerTokenState
 * @category generated
 */
export type InitReferrerTokenStateInstructionAccounts = {
  payer: web3.PublicKey
  lendingMarket: web3.PublicKey
  reserve: web3.PublicKey
  referrerTokenState: web3.PublicKey
  rent?: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initReferrerTokenStateInstructionDiscriminator = [
  116, 45, 66, 148, 58, 13, 218, 115,
]

/**
 * Creates a _InitReferrerTokenState_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitReferrerTokenState
 * @category generated
 */
export function createInitReferrerTokenStateInstruction(
  accounts: InitReferrerTokenStateInstructionAccounts,
  args: InitReferrerTokenStateInstructionArgs,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = initReferrerTokenStateStruct.serialize({
    instructionDiscriminator: initReferrerTokenStateInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.lendingMarket,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.reserve,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.referrerTokenState,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
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