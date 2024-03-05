/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link UserMetadata}
 * @category Accounts
 * @category generated
 */
export type UserMetadataArgs = {
  referrer: web3.PublicKey
  bump: beet.bignum
  userLookupTable: web3.PublicKey
  owner: web3.PublicKey
  padding1: beet.bignum[] /* size: 51 */
  padding2: beet.bignum[] /* size: 64 */
}

export const userMetadataDiscriminator = [157, 214, 220, 235, 98, 135, 171, 28]
/**
 * Holds the data for the {@link UserMetadata} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class UserMetadata implements UserMetadataArgs {
  private constructor(
    readonly referrer: web3.PublicKey,
    readonly bump: beet.bignum,
    readonly userLookupTable: web3.PublicKey,
    readonly owner: web3.PublicKey,
    readonly padding1: beet.bignum[] /* size: 51 */,
    readonly padding2: beet.bignum[] /* size: 64 */
  ) {}

  /**
   * Creates a {@link UserMetadata} instance from the provided args.
   */
  static fromArgs(args: UserMetadataArgs) {
    return new UserMetadata(
      args.referrer,
      args.bump,
      args.userLookupTable,
      args.owner,
      args.padding1,
      args.padding2
    )
  }

  /**
   * Deserializes the {@link UserMetadata} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [UserMetadata, number] {
    return UserMetadata.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link UserMetadata} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<UserMetadata> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find UserMetadata account at ${address}`)
    }
    return UserMetadata.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, userMetadataBeet)
  }

  /**
   * Deserializes the {@link UserMetadata} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [UserMetadata, number] {
    return userMetadataBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link UserMetadata} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return userMetadataBeet.serialize({
      accountDiscriminator: userMetadataDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link UserMetadata}
   */
  static get byteSize() {
    return userMetadataBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link UserMetadata} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      UserMetadata.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link UserMetadata} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === UserMetadata.byteSize
  }

  /**
   * Returns a readable version of {@link UserMetadata} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      referrer: this.referrer.toBase58(),
      bump: (() => {
        const x = <{ toNumber: () => number }>this.bump
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      userLookupTable: this.userLookupTable.toBase58(),
      owner: this.owner.toBase58(),
      padding1: this.padding1,
      padding2: this.padding2,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const userMetadataBeet = new beet.BeetStruct<
  UserMetadata,
  UserMetadataArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['referrer', beetSolana.publicKey],
    ['bump', beet.u64],
    ['userLookupTable', beetSolana.publicKey],
    ['owner', beetSolana.publicKey],
    ['padding1', beet.uniformFixedSizeArray(beet.u64, 51)],
    ['padding2', beet.uniformFixedSizeArray(beet.u64, 64)],
  ],
  UserMetadata.fromArgs,
  'UserMetadata'
)
