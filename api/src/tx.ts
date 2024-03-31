import {
  AccountInfo,
  AccountMeta,
  AddressLookupTableProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  BestLendUserAccount,
  PROGRAM_ID,
  createInitAccountInstruction,
  createInitKlendAccountInstruction,
  createKlendBorrowInstruction,
  createKlendDepositInstruction,
  createKlendRepayInstruction,
  createKlendWithdrawInstruction,
} from "../../clients/bestlend/src";
import {
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Obligation,
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
  createCloseAccountInstruction,
} from "@solana/spl-token";
import { connection } from "./rpc";
import { ORACLES, priorityFeeIx } from "./swap";
import { KLEND_MARKET, MINTS } from "./klend";
import { PROGRAM_ID as SWAP_PROGRAM_ID } from "../../clients/dummy-swap/src";
import bs58 from "bs58";
import chalk from "chalk";
import {
  KaminoMarket,
  KaminoObligation,
} from "@hubbleprotocol/kamino-lending-sdk";

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

  const ixs: TransactionInstruction[] = [];
  ixs.push(...priorityFeeIx());

  let extendLutTxs: Uint8Array[] = [];
  try {
    await BestLendUserAccount.fromAccountAddress(
      connection,
      bestlendUserAccount
    );
  } catch (e) {
    const [is, lutIxs] = await createAccountIxs(user, ticker);
    extendLutTxs.push(...lutIxs);

    console.log(chalk.yellow(`new account adding ${is.length} init ixs`));
    ixs.push(...is);
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
  if (ix1) ixs.push(ix1);
  if (ix2) ixs.push(ix2);
  if (ix3) ixs.push(ix3);

  // maybe wrap
  if (ticker === "SOL") {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: user,
        toPubkey: userLiquidityAta,
        lamports: amount,
      }),
      createSyncNativeInstruction(userLiquidityAta)
    );
  }

  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  const obligations = await market.getAllUserObligations(bestlendUserAccount);
  const obl = obligations?.[0];
  if (obl) {
    ixs.push(...buildRefreshObligationIxs(obl, reserve));
  }

  ixs.push(
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
  const msg = new TransactionMessage({
    payerKey: user,
    recentBlockhash: latest.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);

  return {
    tx: Buffer.from(tx.serialize()).toString("base64"),
    extendLutTxs: extendLutTxs.map((t) => Buffer.from(t).toString("base64")),
  };
};

export const borrow = async (req, res) => {
  const { pubkey, reserve: reserveKey, amount, ticker } = req.body;
  const user = new PublicKey(pubkey);
  const reserve = new PublicKey(reserveKey);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const ixs: TransactionInstruction[] = [];
  ixs.push(...priorityFeeIx());

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
  const [userLiquidityAta, ix1] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.liquidity.mintPubkey,
    user
  );

  // might need to create ata accounts
  if (ix1) ixs.push(ix1);

  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  const obligations = await market.getAllUserObligations(bestlendUserAccount);
  const obl = obligations?.[0];
  if (obl) {
    ixs.push(...buildRefreshObligationIxs(obl, reserve));
  }

  ixs.push(
    createKlendBorrowInstruction(
      {
        signer: user,
        bestlendUserAccount,
        obligation,
        klendProgram: KLEND_PROGRAM_ID,
        lendingMarket: LENDING_MARKET,
        lendingMarketAuthority,
        reserve: reserve,
        userDestinationLiquidity: userLiquidityAta,
        instructions: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
        reserveSourceLiquidity: reserveData.liquidity.supplyVault,
        borrowReserveLiquidityFeeReceiver: reserveData.liquidity.feeVault,
      },
      {
        amount,
      }
    )
  );

  // unwrap SOL
  if (ticker === "SOL") {
    ixs.push(createCloseAccountInstruction(userLiquidityAta, user, user));
  }

  const latest = await connection.getLatestBlockhash();
  const msg = new TransactionMessage({
    payerKey: user,
    recentBlockhash: latest.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);

  return {
    tx: Buffer.from(tx.serialize()).toString("base64"),
  };
};

export const repay = async (req, res) => {
  const { pubkey, reserve: reserveKey, amount, ticker } = req.body;
  const user = new PublicKey(pubkey);
  const reserve = new PublicKey(reserveKey);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const ixs: TransactionInstruction[] = [];
  ixs.push(...priorityFeeIx());

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
  if (ix2) ixs.push(ix2);
  if (ix3) ixs.push(ix3);

  // maybe wrap
  if (ticker === "SOL") {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: user,
        toPubkey: userLiquidityAta,
        lamports: amount,
      }),
      createSyncNativeInstruction(userLiquidityAta)
    );
  }

  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  const obligations = await market.getAllUserObligations(bestlendUserAccount);
  const obl = obligations?.[0];
  if (obl) {
    ixs.push(...buildRefreshObligationIxs(obl, reserve));
  }

  ixs.push(
    createKlendRepayInstruction(
      {
        signer: user,
        bestlendUserAccount,
        obligation,
        klendProgram: KLEND_PROGRAM_ID,
        lendingMarket: LENDING_MARKET,
        reserve: reserve,
        userSourceLiquidity: userLiquidityAta,
        bestlendUserSourceLiquidity: liquidityAta,
        reserveDestinationLiquidity: reserveData.liquidity.supplyVault,
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
  const msg = new TransactionMessage({
    payerKey: user,
    recentBlockhash: latest.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);

  return {
    tx: Buffer.from(tx.serialize()).toString("base64"),
  };
};

export const withdraw = async (req, res) => {
  const { pubkey, reserve: reserveKey, amount, ticker } = req.body;
  const user = new PublicKey(pubkey);
  const reserve = new PublicKey(reserveKey);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const ixs: TransactionInstruction[] = [];
  ixs.push(...priorityFeeIx());

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
  const [userLiquidityAta, ix1] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.liquidity.mintPubkey,
    user
  );
  const [collateralAta, ix2] = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    reserveData.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );

  // might need to create ata accounts
  if (ix1) ixs.push(ix1);
  if (ix2) ixs.push(ix2);

  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  const obligations = await market.getAllUserObligations(bestlendUserAccount);
  const obl = obligations?.[0];
  if (obl) {
    ixs.push(...buildRefreshObligationIxs(obl, reserve));
  }

  ixs.push(
    createKlendWithdrawInstruction(
      {
        signer: user,
        bestlendUserAccount,
        obligation,
        klendProgram: KLEND_PROGRAM_ID,
        lendingMarket: LENDING_MARKET,
        lendingMarketAuthority,
        reserve: reserve,
        userDestinationLiquidity: userLiquidityAta,
        reserveLiquiditySupply: reserveData.liquidity.supplyVault,
        reserveCollateralMint: reserveData.collateral.mintPubkey,
        reserveSourceDepositCollateral: reserveData.collateral.supplyVault,
        userDestinationCollateral: collateralAta,
        instructions: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
      },
      {
        amount,
      }
    )
  );

  // unwrap SOL
  if (ticker === "SOL") {
    ixs.push(createCloseAccountInstruction(userLiquidityAta, user, user));
  }

  const latest = await connection.getLatestBlockhash();
  const msg = new TransactionMessage({
    payerKey: user,
    recentBlockhash: latest.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);

  return {
    tx: Buffer.from(tx.serialize()).toString("base64"),
  };
};

export const createAccountIxs = async (
  user: PublicKey,
  ticker: string
): Promise<[TransactionInstruction[], Uint8Array[]]> => {
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

  const performer = Keypair.fromSecretKey(
    bs58.decode(process.env.PERFORMER_KEY)
  );

  let latestBlockhash = await connection.getLatestBlockhash("finalized");

  // create seperate lookup table ixs
  const serializedTxs: Uint8Array[] = [];
  const addresses = getALTKeys(user, performer.publicKey);
  for (const addy of [
    addresses.slice(0, 25),
    addresses.slice(25, 50),
    addresses.slice(50),
  ]) {
    if (addy.length === 0) continue;

    const ix = AddressLookupTableProgram.extendLookupTable({
      payer: user,
      authority: user,
      lookupTable: lookupTableAddress,
      addresses: addy,
    });

    const msg = new TransactionMessage({
      payerKey: user,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(msg);
    serializedTxs.push(tx.serialize());
  }

  return [ixs, serializedTxs];
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

const getALTKeys = (user: PublicKey, performer: PublicKey) => {
  // oracles and klend reserves
  const addresses = [
    ...Object.keys(ORACLES).map((k) => new PublicKey(k)),
    ...Object.values(ORACLES).map((k) => new PublicKey(k)),
  ];

  const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), new PublicKey(KLEND_MARKET).toBuffer()],
    KLEND_PROGRAM_ID
  );

  // program ids
  addresses.push(
    PROGRAM_ID,
    KLEND_PROGRAM_ID,
    SWAP_PROGRAM_ID,
    new PublicKey(KLEND_MARKET),
    lendingMarketAuthority,
    new PublicKey("Sysvar1nstructions1111111111111111111111111")
  );

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );
  addresses.push(bestlendUserAccount);

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
  addresses.push(obligation);

  // performer and user atas
  for (let m of Object.keys(MINTS)) {
    const mint = new PublicKey(m);

    addresses.push(getAssociatedTokenAddressSync(mint, performer));
    addresses.push(getAssociatedTokenAddressSync(mint, user));
    addresses.push(
      getAssociatedTokenAddressSync(mint, bestlendUserAccount, true)
    );

    // reserve PDAs
    const [feeReceiver] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee_receiver"),
        new PublicKey(KLEND_MARKET).toBuffer(),
        mint.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveLiquiditySupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_liq_supply"),
        new PublicKey(KLEND_MARKET).toBuffer(),
        mint.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_mint"),
        new PublicKey(KLEND_MARKET).toBuffer(),
        mint.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralSupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_supply"),
        new PublicKey(KLEND_MARKET).toBuffer(),
        mint.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );

    addresses.push(
      feeReceiver,
      reserveLiquiditySupply,
      reserveCollateralMint,
      reserveCollateralSupply
    );
  }

  return addresses;
};

export const buildRefreshObligationIxs = (
  obl: KaminoObligation,
  targetReserve: PublicKey,
  forceTargetInRefresh = false
): TransactionInstruction[] => {
  const ixs: TransactionInstruction[] = [];
  const anchorRemainingAccounts: AccountMeta[] = [];

  let targetInRemaining = false;
  for (const res of [
    ...obl.getDeposits().map((d) => d.reserveAddress),
    ...obl.getBorrows().map((d) => d.reserveAddress),
  ]) {
    // target reserve has to go last
    if (!res.equals(targetReserve)) {
      ixs.push(
        createRefreshReserveInstruction({
          reserve: res,
          lendingMarket: LENDING_MARKET,
          pythOracle: new PublicKey(ORACLES[res.toBase58()]),
        })
      );
    } else {
      targetInRemaining = true;
    }
    anchorRemainingAccounts.push({
      pubkey: res,
      isSigner: false,
      isWritable: false,
    });
  }

  // obligation data might not have target deposit if composite ix
  if (forceTargetInRefresh && !targetInRemaining) {
    anchorRemainingAccounts.push({
      pubkey: targetReserve,
      isSigner: false,
      isWritable: false,
    });
  }

  ixs.push(
    createRefreshReserveInstruction({
      reserve: targetReserve,
      lendingMarket: LENDING_MARKET,
      pythOracle: new PublicKey(ORACLES[targetReserve.toBase58()]),
    })
  );

  ixs.push(
    createRefreshObligationInstruction({
      lendingMarket: LENDING_MARKET,
      obligation: obl.obligationAddress,
      anchorRemainingAccounts,
    })
  );

  return ixs;
};
