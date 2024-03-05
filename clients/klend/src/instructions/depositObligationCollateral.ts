/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category DepositObligationCollateral
 * @category generated
 */
export type DepositObligationCollateralInstructionArgs = {
  collateralAmount: beet.bignum
}
/**
 * @category Instructions
 * @category DepositObligationCollateral
 * @category generated
 */
export const depositObligationCollateralStruct = new beet.BeetArgsStruct<
  DepositObligationCollateralInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['collateralAmount', beet.u64],
  ],
  'DepositObligationCollateralInstructionArgs'
)
/**
 * Accounts required by the _depositObligationCollateral_ instruction
 *
 * @property [**signer**] owner
 * @property [_writable_] obligation
 * @property [] lendingMarket
 * @property [_writable_] depositReserve
 * @property [_writable_] reserveDestinationCollateral
 * @property [_writable_] userSourceCollateral
 * @property [] instructionSysvarAccount
 * @category Instructions
 * @category DepositObligationCollateral
 * @category generated
 */
export type DepositObligationCollateralInstructionAccounts = {
  owner: web3.PublicKey
  obligation: web3.PublicKey
  lendingMarket: web3.PublicKey
  depositReserve: web3.PublicKey
  reserveDestinationCollateral: web3.PublicKey
  userSourceCollateral: web3.PublicKey
  tokenProgram?: web3.PublicKey
  instructionSysvarAccount: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const depositObligationCollateralInstructionDiscriminator = [
  108, 209, 4, 72, 21, 22, 118, 133,
]

/**
 * Creates a _DepositObligationCollateral_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category DepositObligationCollateral
 * @category generated
 */
export function createDepositObligationCollateralInstruction(
  accounts: DepositObligationCollateralInstructionAccounts,
  args: DepositObligationCollateralInstructionArgs,
  programId = new web3.PublicKey('HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA')
) {
  const [data] = depositObligationCollateralStruct.serialize({
    instructionDiscriminator:
      depositObligationCollateralInstructionDiscriminator,
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
    {
      pubkey: accounts.depositReserve,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.reserveDestinationCollateral,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userSourceCollateral,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
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
