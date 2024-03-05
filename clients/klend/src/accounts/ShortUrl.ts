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
 * Arguments used to create {@link ShortUrl}
 * @category Accounts
 * @category generated
 */
export type ShortUrlArgs = {
  referrer: web3.PublicKey
  shortUrl: string
}

export const shortUrlDiscriminator = [28, 89, 174, 25, 226, 124, 126, 212]
/**
 * Holds the data for the {@link ShortUrl} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class ShortUrl implements ShortUrlArgs {
  private constructor(
    readonly referrer: web3.PublicKey,
    readonly shortUrl: string
  ) {}

  /**
   * Creates a {@link ShortUrl} instance from the provided args.
   */
  static fromArgs(args: ShortUrlArgs) {
    return new ShortUrl(args.referrer, args.shortUrl)
  }

  /**
   * Deserializes the {@link ShortUrl} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [ShortUrl, number] {
    return ShortUrl.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link ShortUrl} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<ShortUrl> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find ShortUrl account at ${address}`)
    }
    return ShortUrl.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, shortUrlBeet)
  }

  /**
   * Deserializes the {@link ShortUrl} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [ShortUrl, number] {
    return shortUrlBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link ShortUrl} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return shortUrlBeet.serialize({
      accountDiscriminator: shortUrlDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link ShortUrl} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: ShortUrlArgs) {
    const instance = ShortUrl.fromArgs(args)
    return shortUrlBeet.toFixedFromValue({
      accountDiscriminator: shortUrlDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link ShortUrl} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: ShortUrlArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      ShortUrl.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link ShortUrl} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      referrer: this.referrer.toBase58(),
      shortUrl: this.shortUrl,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const shortUrlBeet = new beet.FixableBeetStruct<
  ShortUrl,
  ShortUrlArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['referrer', beetSolana.publicKey],
    ['shortUrl', beet.utf8String],
  ],
  ShortUrl.fromArgs,
  'ShortUrl'
)