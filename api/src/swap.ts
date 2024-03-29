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
  createRefreshObligationInstruction,
  createRefreshReserveInstruction,
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Reserve,
} from "../../clients/klend/src";
import { KLEND_MARKET } from "./klend";
import {
  createSwapInstruction,
  PROGRAM_ID as SWAP_PROGRAM_ID,
} from "../../clients/dummy-swap/src";
import {
  BestLendUserAccount,
  PROGRAM_ID,
  createKlendDepositInstruction,
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
  reserves: PublicKey[],
  withdrawReserve: PublicKey,
  depositReserve: PublicKey,
  amount: Decimal
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

  ixs.push(...buildRefreshObligationIxs(obl, withdrawReserve));

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
  const outputAmount = amount.toNumber() / outputMult;

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

  ixs.push(...buildRefreshObligationIxs(obl, depositReserve));

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

  /**
   * POST ACTION
   */
  ixs.push(...buildRefreshObligationIxs(obl, depositReserve));

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
