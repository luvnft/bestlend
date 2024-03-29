import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createRefreshObligationInstruction,
  createRefreshReserveInstruction,
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Reserve,
} from "../../clients/klend/src";
import { KLEND_MARKET } from "klend";
import {
  PROGRAM_ID,
  createKlendWithdrawInstruction,
  createPreActionInstruction,
} from "../../clients/bestlend/src";
import bs58 from "bs58";
import Decimal from "decimal.js";
import { connection } from "rpc";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// https://github.com/Kamino-Finance/klend-sdk/blob/master/src/classes/action.ts#L1373
//
// The support ixns in order are:
// 0. Init obligation ixn
// 0. Token Ata ixns
// 0. Init obligation for farm
// 1. Ixns to refresh the reserves of the obligation not related to the current action
// 2. Ixn to refresh the reserve of the current action
// 3. Ixn to refresh the obligation
// 4. Ixn to refresh the `debt` farm of the obligation
// 5. Ixn to refresh the `collateral` farm of the obligation
// 6. The instruction itself
// 7. Ixn to refresh the `debt` farm of the obligation
// 8. Ixn to refresh the `collateral` farm of the obligation

// reserve -> oracle
const ORACLES = {
  GaCnWqvQSnLRrq2WG7qYDSdy3GZWPj3LDrrPgP6CvKRf:
    "8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi",
  "2VdhFUZqZ3yKxfT8aXwNXj9g7UpxZ3KegRqRV8d2Bv8V":
    "DoYnB3k4dfDmh3tgZvUUCsd9548CWBhAJwzyKWiDDj5f",
  "7jeNhz5pQhnewxSrpPhgBDbaJKvzCervsyqm5pKL86UL":
    "B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU",
  DhSnsVombww6yFD5MUg91xEP75qyXgDPJnR4faQKonqk:
    "9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt",
  "7AZCu3Fwqi5JQT3jve7DWBxgoCGPek2Xcpo4xGxz8BhV":
    "5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p",
  "5ddtzRMHNhttv77oBHC3A4RAv4bGHfmdzqW5EmPwXBzw":
    "FBwd4ar6hQugVXjzX21SABSLXtzoJ5rnyb6bQBkFLyMp",
};

export const swapUserAssetsPerformer = async (
  user: PublicKey,
  reserves: PublicKey[],
  withdrawReserve: PublicKey,
  borrowReserve: PublicKey,
  amount: Decimal
): Promise<string> => {
  const performer = Keypair.fromSecretKey(
    bs58.decode(process.env.PERFORMER_KEY)
  );
  const ixs: TransactionInstruction[] = [];

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const [obligation] = PublicKey.findProgramAddressSync(
    [
      Uint8Array.from([0]),
      Uint8Array.from([0]),
      bestlendUserAccount.toBuffer(),
      new PublicKey(KLEND_MARKET).toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ],
    KLEND_PROGRAM_ID
  );

  for (let reserve of reserves) {
    ixs.push(
      createRefreshReserveInstruction({
        reserve: reserve,
        lendingMarket: new PublicKey(KLEND_MARKET),
        pythOracle: new PublicKey(ORACLES[reserve.toBase58()]),
      })
    );
  }

  ixs.push(
    createRefreshObligationInstruction({
      lendingMarket: new PublicKey(KLEND_MARKET),
      obligation,
      anchorRemainingAccounts: reserves.map((r) => ({
        pubkey: r,
        isSigner: false,
        isWritable: false,
      })),
    })
  );

  /**
   * PRE ACTION
   */
  ixs.push(
    createPreActionInstruction(
      {
        signer: performer.publicKey,
        bestlendUserAccount,
        klendObligation: obligation,
        instructions: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
      },
      {
        minAccountValue: 0,
        minAccountExpo: 0,
      }
    )
  );

  /**
   * REBALANCE
   */
  for (let reserve of reserves) {
    ixs.push(
      createRefreshReserveInstruction({
        reserve: reserve,
        lendingMarket: new PublicKey(KLEND_MARKET),
        pythOracle: new PublicKey(ORACLES[reserve.toBase58()]),
      })
    );
  }

  ixs.push(
    createRefreshObligationInstruction({
      lendingMarket: new PublicKey(KLEND_MARKET),
      obligation,
      anchorRemainingAccounts: reserves.map((r) => ({
        pubkey: r,
        isSigner: false,
        isWritable: false,
      })),
    })
  );

  const withdrawReserveData = await Reserve.fromAccountAddress(
    connection,
    withdrawReserve
  );

  const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), new PublicKey(KLEND_MARKET).toBuffer()],
    KLEND_PROGRAM_ID
  );

  // withdraw ATAs
  const userLiquidityAta = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    withdrawReserveData.liquidity.mintPubkey,
    performer.publicKey,
    true
  );
  const collateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    withdrawReserveData.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );

  ixs.push(
    createKlendWithdrawInstruction(
      {
        signer: performer.publicKey,
        bestlendUserAccount,
        userDestinationLiquidity: userLiquidityAta.address,
        userDestinationCollateral: collateralAta.address,
        instructions: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
        klendProgram: KLEND_PROGRAM_ID,
        obligation,
        lendingMarket: new PublicKey(KLEND_MARKET),
        reserve: withdrawReserve,
        reserveLiquiditySupply: withdrawReserveData.liquidity.supplyVault,
        reserveCollateralMint: withdrawReserveData.collateral.mintPubkey,
        reserveSourceDepositCollateral:
          withdrawReserveData.collateral.supplyVault,
        lendingMarketAuthority,
      },
      {
        amount: amount.toNumber(),
      }
    )
  );

  // swap

  return "";
};
