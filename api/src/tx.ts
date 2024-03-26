import {
  AddressLookupTableProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  BestLendUserAccount,
  PROGRAM_ID,
  createInitAccountInstruction,
  createInitKlendAccountInstruction,
  createKlendDepositInstruction,
} from "../../clients/bestlend/src";
import {
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Reserve,
  createRefreshObligationInstruction,
  createRefreshReserveInstruction,
} from "../../clients/klend/src";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import { connection } from "./rpc";

const LENDING_MARKET = new PublicKey(
  "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn"
);

const oracles = {
  USDC: new PublicKey("8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi"),
  USDT: new PublicKey("DoYnB3k4dfDmh3tgZvUUCsd9548CWBhAJwzyKWiDDj5f"),
  SOL: new PublicKey("B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU"),
  JitoSOL: new PublicKey("9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt"),
  mSOL: new PublicKey("5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p"),
  bSOL: new PublicKey("FBwd4ar6hQugVXjzX21SABSLXtzoJ5rnyb6bQBkFLyMp"),
};

export const deposit = async (req, res) => {
  const { pubkey, reserve: reserveKey, amount, ticker } = req.body;
  const user = new PublicKey(pubkey);
  const reserve = new PublicKey(reserveKey);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const tx = new Transaction();

  try {
    await BestLendUserAccount.fromAccountAddress(
      connection,
      bestlendUserAccount
    );
  } catch (e) {
    console.log("error getting bestlend account; adding init ixs: ", e);
    const ixs = await createAccountIxs(user, ticker);
    tx.add(...ixs);
  }

  const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), LENDING_MARKET.toBuffer()],
    KLEND_PROGRAM_ID
  );

  const reserveData = await Reserve.fromAccountAddress(connection, reserve);

  const [obligation] = PublicKey.findProgramAddressSync(
    [
      Uint8Array.from([0]),
      Uint8Array.from([0]),
      bestlendUserAccount.toBuffer(),
      LENDING_MARKET.toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ],
    KLEND_PROGRAM_ID
  );

  // user account / PDA ATAs
  const [collateralAta, ix1] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );
  const [liquidityAta, ix2] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.liquidity.mintPubkey,
    bestlendUserAccount,
    true
  );
  const [userLiquidityAta, ix3] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.liquidity.mintPubkey,
    user
  );

  // might need to create ata accounts
  if (ix1) tx.add(ix1);
  if (ix2) tx.add(ix2);
  if (ix3) tx.add(ix3);

  // maybe wrap
  if (ticker === "SOL") {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: user,
        toPubkey: userLiquidityAta,
        lamports: amount,
      }),
      createSyncNativeInstruction(userLiquidityAta)
    );
  }

  tx.add(
    createRefreshReserveInstruction({
      reserve: reserve,
      lendingMarket: LENDING_MARKET,
      pythOracle: oracles[ticker],
    })
  );

  tx.add(
    createRefreshObligationInstruction({
      lendingMarket: LENDING_MARKET,
      obligation,
    })
  );

  tx.add(
    createKlendDepositInstruction(
      {
        signer: user,
        bestlendUserAccount,
        obligation,
        klendProgram: KLEND_PROGRAM_ID,
        lendingMarket: LENDING_MARKET,
        lendingMarketAuthority,
        reserve: reserve,
        reserveLiquiditySupply: reserveData.liquidity.supplyVault,
        reserveCollateralMint: reserveData.collateral.mintPubkey,
        reserveDestinationDepositCollateral: reserveData.collateral.supplyVault,
        userSourceLiquidity: userLiquidityAta,
        bestlendUserSourceLiquidity: liquidityAta,
        userDestinationCollateral: collateralAta,
        instructionSysvarAccount: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
      },
      {
        amount,
      }
    )
  );

  const latest = await connection.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = user;

  return { tx: tx.serialize({ verifySignatures: false }).toString("base64") };
};

export const createAccountIxs = async (user: PublicKey, ticker: string) => {
  const ixs: TransactionInstruction[] = [];

  const [lookupTableIx, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: user,
      payer: user,
      recentSlot: await connection.getSlot("finalized"),
    });

  ixs.push(lookupTableIx);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const [userMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_meta"), bestlendUserAccount.toBuffer()],
    KLEND_PROGRAM_ID
  );

  const [obligation] = PublicKey.findProgramAddressSync(
    [
      Uint8Array.from([0]),
      Uint8Array.from([0]),
      bestlendUserAccount.toBuffer(),
      LENDING_MARKET.toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ],
    KLEND_PROGRAM_ID
  );

  ixs.push(
    createInitAccountInstruction(
      {
        owner: user,
        bestlendUserAccount,
      },
      {
        collateralGroup: ticker.includes("USD") ? 0 : 1,
        debtGroup: ticker.includes("USD") ? 1 : 0,
        lookupTable: lookupTableAddress,
      }
    )
  );

  ixs.push(
    createInitKlendAccountInstruction({
      owner: user,
      bestlendUserAccount,
      obligation,
      lendingMarket: LENDING_MARKET,
      seed1Account: PublicKey.default,
      seed2Account: PublicKey.default,
      userMetadata: userMetadata,
      klendProgram: KLEND_PROGRAM_ID,
    })
  );

  return ixs;
};

const getOrCreateAssociatedTokenAccount = async (
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false
): Promise<[PublicKey, TransactionInstruction?]> => {
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve
  );

  try {
    await getAccount(connection, associatedToken);
    return [associatedToken, undefined];
  } catch (error: unknown) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      const ix = createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint
      );
      return [associatedToken, ix];
    } else {
      throw error;
    }
  }
};
