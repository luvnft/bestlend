import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Reserve,
} from "../../clients/klend/src";
import { KLEND_MARKET, MINTS } from "./klend";
import {
  createSwapInstruction,
  PROGRAM_ID as SWAP_PROGRAM_ID,
} from "../../clients/dummy-swap/src";
import {
  BestLendUserAccount,
  PROGRAM_ID,
  createKlendBorrowInstruction,
  createKlendDepositInstruction,
  createKlendRepayInstruction,
  createKlendWithdrawInstruction,
  createPostActionInstruction,
  createPreActionInstruction,
} from "../../clients/bestlend/src";
import bs58 from "bs58";
import Decimal from "decimal.js";
import { connection } from "./rpc";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { buildRefreshObligationIxs } from "./tx";
import { KaminoObligation } from "@hubbleprotocol/kamino-lending-sdk";
import chalk from "chalk";

// https://github.com/Kamino-Finance/klend-sdk/blob/master/src/classes/action.ts#L1373
//
// The support ixns in order are:
// - Init obligation ixn
// - Token Ata ixns
// - Ixns to refresh the reserves of the obligation not related to the current action
// - Ixn to refresh the reserve of the current action
// - Ixn to refresh the obligation
// - The instruction itself

// reserve -> oracle
export const ORACLES = {
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

const PRICES = {
  GaCnWqvQSnLRrq2WG7qYDSdy3GZWPj3LDrrPgP6CvKRf: 0.9998,
  "2VdhFUZqZ3yKxfT8aXwNXj9g7UpxZ3KegRqRV8d2Bv8V": 0.9977,
  "7jeNhz5pQhnewxSrpPhgBDbaJKvzCervsyqm5pKL86UL": 126.7,
  DhSnsVombww6yFD5MUg91xEP75qyXgDPJnR4faQKonqk: 137.2,
  "7AZCu3Fwqi5JQT3jve7DWBxgoCGPek2Xcpo4xGxz8BhV": 147.1,
  "5ddtzRMHNhttv77oBHC3A4RAv4bGHfmdzqW5EmPwXBzw": 140.3,
};

export const swapUserAssetsPerformer = async (
  user: PublicKey,
  obl: KaminoObligation,
  withdrawReserve: PublicKey,
  depositReserve: PublicKey,
  amount: Decimal,
  isBorrow = false
): Promise<string> => {
  const performer = Keypair.fromSecretKey(
    bs58.decode(process.env.PERFORMER_KEY)
  );
  const ixs: TransactionInstruction[] = [];
  ixs.push(...priorityFeeIx());

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const blUserAct = await BestLendUserAccount.fromAccountAddress(
    connection,
    bestlendUserAccount
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

  ixs.push(...buildRefreshObligationIxs(obl, withdrawReserve));

  const value = calculateAccountValue(obl);
  const adjustedValue = value * 0.99925;

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
        minAccountValue: Math.ceil(adjustedValue * 10000),
        minAccountExpo: 4,
      }
    )
  );

  /**
   * REBALANCE
   */
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
    performer.publicKey
  );
  const collateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    withdrawReserveData.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );

  ixs.push(...buildRefreshObligationIxs(obl, withdrawReserve));

  if (!isBorrow) {
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
  } else {
    ixs.push(
      createKlendBorrowInstruction(
        {
          signer: performer.publicKey,
          bestlendUserAccount,
          userDestinationLiquidity: userLiquidityAta.address,
          instructions: new PublicKey(
            "Sysvar1nstructions1111111111111111111111111"
          ),
          klendProgram: KLEND_PROGRAM_ID,
          obligation,
          lendingMarket: new PublicKey(KLEND_MARKET),
          reserve: withdrawReserve,
          lendingMarketAuthority,
          reserveSourceLiquidity: withdrawReserveData.liquidity.supplyVault,
          borrowReserveLiquidityFeeReceiver:
            withdrawReserveData.liquidity.feeVault,
        },
        {
          amount: amount.toNumber(),
        }
      )
    );
  }

  const depositReserveData = await Reserve.fromAccountAddress(
    connection,
    depositReserve
  );

  const { tokenPDA, inputATA, outputATA, pdaInputATA, pdaOutputATA } =
    await swapAccounts(
      connection,
      withdrawReserveData.liquidity.mintPubkey,
      depositReserveData.liquidity.mintPubkey,
      performer
    );

  const outputMult =
    PRICES[depositReserve.toBase58()] / PRICES[withdrawReserve.toBase58()];
  const outputAmount = Math.ceil(amount.toNumber() / outputMult);

  // swap
  ixs.push(
    createSwapInstruction(
      {
        swapper: performer.publicKey,
        swapperInputToken: inputATA,
        swapperOutputToken: outputATA,
        tokenHolderPda: tokenPDA,
        pdaInputToken: pdaInputATA,
        pdaOutputToken: pdaOutputATA,
      },
      {
        inputAmout: amount.toNumber(),
        outputAmout: outputAmount,
      }
    )
  );

  console.log(
    chalk.greenBright(
      JSON.stringify({
        withdrawAmount: amount.toNumber(),
        depositAmount: outputAmount,
        depositPrice: PRICES[depositReserve.toBase58()],
        withdrawPrice: PRICES[withdrawReserve.toBase58()],
        isBorrow,
      })
    )
  );

  const depositCollateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    depositReserveData.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );
  const liquidityAta = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    depositReserveData.liquidity.mintPubkey,
    bestlendUserAccount,
    true
  );

  // borrow reserve might not be included
  if (isBorrow) {
    if (
      obl
        .getBorrows()
        .findIndex((d) => d.reserveAddress.equals(withdrawReserve)) === -1
    ) {
      obl.borrows.set(withdrawReserve, {
        reserveAddress: withdrawReserve,
        mintAddress: withdrawReserveData.liquidity.mintPubkey,
        amount: new Decimal(0),
        marketValueRefreshed: new Decimal(0),
      });
    }
  }

  ixs.push(...buildRefreshObligationIxs(obl, depositReserve));

  if (!isBorrow) {
    ixs.push(
      createKlendDepositInstruction(
        {
          signer: performer.publicKey,
          bestlendUserAccount,
          userSourceLiquidity: outputATA,
          bestlendUserSourceLiquidity: liquidityAta.address,
          klendProgram: KLEND_PROGRAM_ID,
          obligation,
          lendingMarket: new PublicKey(KLEND_MARKET),
          reserve: depositReserve,
          reserveLiquiditySupply: depositReserveData.liquidity.supplyVault,
          reserveCollateralMint: depositReserveData.collateral.mintPubkey,
          reserveDestinationDepositCollateral:
            depositReserveData.collateral.supplyVault,
          lendingMarketAuthority,
          userDestinationCollateral: depositCollateralAta.address,
          instructionSysvarAccount: new PublicKey(
            "Sysvar1nstructions1111111111111111111111111"
          ),
        },
        {
          amount: outputAmount,
        }
      )
    );
  } else {
    ixs.push(
      createKlendRepayInstruction(
        {
          signer: performer.publicKey,
          bestlendUserAccount,
          userSourceLiquidity: outputATA,
          bestlendUserSourceLiquidity: liquidityAta.address,
          klendProgram: KLEND_PROGRAM_ID,
          obligation,
          lendingMarket: new PublicKey(KLEND_MARKET),
          reserve: depositReserve,
          reserveDestinationLiquidity: depositReserveData.liquidity.supplyVault,
          instructionSysvarAccount: new PublicKey(
            "Sysvar1nstructions1111111111111111111111111"
          ),
        },
        {
          amount: outputAmount,
        }
      )
    );
  }

  /**
   * POST ACTION
   */

  // deposit is not in deposits
  if (!isBorrow) {
    if (
      obl
        .getDeposits()
        .findIndex((d) => d.reserveAddress.equals(depositReserve)) === -1
    ) {
      obl.deposits.set(depositReserve, {
        reserveAddress: depositReserve,
        mintAddress: depositReserveData.liquidity.mintPubkey,
        amount: new Decimal(0),
        marketValueRefreshed: new Decimal(0),
      });
    }
  }

  ixs.push(...buildRefreshObligationIxs(obl, PublicKey.default, true));

  ixs.push(
    createPostActionInstruction({
      signer: performer.publicKey,
      bestlendUserAccount,
      klendObligation: obligation,
      instructions: new PublicKey(
        "Sysvar1nstructions1111111111111111111111111"
      ),
    })
  );

  // send
  const lookupTableAccount = (
    await connection.getAddressLookupTable(blUserAct.lookupTable)
  ).value;
  let latestBlockhash = await connection.getLatestBlockhash("finalized");

  const msg = new TransactionMessage({
    payerKey: performer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message([lookupTableAccount]);

  const tx = new VersionedTransaction(msg);
  tx.sign([performer]);

  return connection.sendTransaction(tx, { skipPreflight: true });
};

const swapAccounts = async (
  connection: Connection,
  inputMint: PublicKey,
  outputMint: PublicKey,
  performer: Keypair
) => {
  const [tokenPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_holder")],
    SWAP_PROGRAM_ID
  );
  const { address: inputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    inputMint,
    performer.publicKey,
    true
  );
  const { address: outputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    outputMint,
    performer.publicKey,
    true
  );
  const { address: pdaInputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    inputMint,
    tokenPDA,
    true
  );
  const { address: pdaOutputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    performer,
    outputMint,
    tokenPDA,
    true
  );
  return {
    tokenPDA,
    inputATA,
    outputATA,
    pdaInputATA,
    pdaOutputATA,
  };
};

export const priorityFeeIx = () => {
  const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 500_000,
  });
  const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_400_000,
  });
  return [computePriceIx, computeLimitIx];
};

export const calculateAccountValue = (obl: KaminoObligation) => {
  const deposits = obl
    .getDeposits()
    .map((d) => d.marketValueRefreshed.toNumber());
  const borrows = obl
    .getBorrows()
    .map((b) => b.marketValueRefreshed.toNumber());
  return (
    deposits.reduce((acc, current) => acc + current, 0) -
    borrows.reduce((acc, current) => acc + current, 0)
  );
};
