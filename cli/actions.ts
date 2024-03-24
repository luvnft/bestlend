require("dotenv").config();
import { Command } from "commander";
import {
  Transaction,
  Keypair,
  SystemProgram,
  PublicKey,
  AddressLookupTableProgram,
} from "@solana/web3.js";
import fs from "fs";
import { keys } from "../keys";
import { keyPairFromB58 } from "../tests/utils";
import { ShyftSdk, Network } from "@shyft-to/js";
import { createWritePythPriceInstruction } from "../clients/mock-pyth/src";
import {
  PROGRAM_ID as KLEND_PROGRAM_ID,
  Reserve,
  createInitLendingMarketInstruction,
  createInitReserveInstruction,
  createRefreshObligationInstruction,
  createRefreshReserveInstruction,
  createUpdateEntireReserveConfigInstruction,
} from "../clients/klend/src";
import { getReserveConfig } from "../tests/configs";
import {
  PROGRAM_ID,
  createInitAccountInstruction,
  createInitKlendAccountInstruction,
  createKlendDepositInstruction,
} from "../clients/bestlend/src";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { mintTo } from "@solana/spl-token";

const defaultKeypairLocation = "/home/sc4recoin/.config/solana/id.json";
const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];
const PRICES = [9998, 9977, 1267000, 1372000, 1471000, 1403000];

const shyft = new ShyftSdk({
  apiKey: process.env.SHYFT_API_KEY ?? "",
  network: Network.Devnet,
});

const cli = new Command();

cli
  .command("initProgram")
  .option(
    "-kp, --keypair <keypair>",
    "location of keypair",
    defaultKeypairLocation
  )
  .action(async ({ keypair }) => {
    const wallet = loadKeypair(keypair);
  });

cli
  .command("writePythPrice")
  .argument("<ticker>", "ticker of asset")
  .argument("<price>", "price in base")
  .argument("<decimals>", "price decimals")
  .action(async (ticker, price, decimals) => {
    const wallet = loadKeypair(defaultKeypairLocation);
    const oracle = keyPairFromB58(keys.oracles[ticker]);

    const ix = createWritePythPriceInstruction(
      {
        target: oracle.publicKey,
        signer: wallet.publicKey,
      },
      {
        price: parseInt(price),
        expo: parseInt(decimals) * -1,
        slot: 1,
        timestampSec: 1,
      }
    );

    const tx = new Transaction().add(ix);

    const signature = await shyft.connection.sendTransaction(tx, [
      wallet,
      oracle,
    ]);
    console.log({ signature });
  });

cli.command("initLendingMarket").action(async () => {
  const wallet = loadKeypair(defaultKeypairLocation);
  const lendingMarket = keyPairFromB58(keys.lendingMarket);

  const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
    KLEND_PROGRAM_ID
  );

  const quoteCurrency = Array(32).fill(0);
  Buffer.from("USD").forEach((b, i) => (quoteCurrency[i] = b));

  const minBalance = await shyft.connection.getMinimumBalanceForRentExemption(
    4656 + 8
  );
  const createMarketAccountTx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: lendingMarket.publicKey,
    lamports: minBalance,
    space: 4656 + 8,
    programId: KLEND_PROGRAM_ID,
  });

  let tx = new Transaction().add(createMarketAccountTx);
  let signature = await shyft.connection.sendTransaction(tx, [
    wallet,
    lendingMarket,
  ]);
  console.log({ signature });
  await sleep(5000);

  tx = new Transaction().add(
    createInitLendingMarketInstruction(
      {
        lendingMarketOwner: wallet.publicKey,
        lendingMarket: lendingMarket.publicKey,
        lendingMarketAuthority,
      },
      {
        quoteCurrency,
      }
    )
  );

  signature = await shyft.connection.sendTransaction(tx, [wallet]);
  console.log({ signature });
});

cli
  .command("initReserve")
  .argument("<ticker>", "ticker of asset")
  .action(async (ticker) => {
    const wallet = loadKeypair(defaultKeypairLocation);
    const lendingMarket = keyPairFromB58(keys.lendingMarket);
    const mintKey =
      ticker !== "SOL"
        ? keyPairFromB58(keys.mints[ticker]).publicKey
        : new PublicKey("So11111111111111111111111111111111111111112");
    const reserve = keyPairFromB58(keys.reserves[ticker]);

    const minBalance = await shyft.connection.getMinimumBalanceForRentExemption(
      8616 + 8
    );
    const createReserveAccountTx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: reserve.publicKey,
      lamports: minBalance,
      space: 8616 + 8,
      programId: KLEND_PROGRAM_ID,
    });

    let tx = new Transaction().add(createReserveAccountTx);
    let signature = await shyft.connection.sendTransaction(tx, [
      wallet,
      reserve,
    ]);
    console.log({ signature });

    const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
      KLEND_PROGRAM_ID
    );

    const [feeReceiver] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee_receiver"),
        lendingMarket.publicKey.toBuffer(),
        mintKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveLiquiditySupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_liq_supply"),
        lendingMarket.publicKey.toBuffer(),
        mintKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_mint"),
        lendingMarket.publicKey.toBuffer(),
        mintKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralSupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_supply"),
        lendingMarket.publicKey.toBuffer(),
        mintKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );

    let txInit = new Transaction().add(
      createInitReserveInstruction({
        lendingMarketOwner: wallet.publicKey,
        lendingMarket: lendingMarket.publicKey,
        lendingMarketAuthority,
        reserve: reserve.publicKey,
        reserveLiquidityMint: mintKey,
        feeReceiver,
        reserveLiquiditySupply,
        reserveCollateralMint,
        reserveCollateralSupply,
      })
    );

    let signatureInit = await shyft.connection.sendTransaction(txInit, [
      wallet,
    ]);
    console.log({ signature: signatureInit });
  });

cli.command("updateReserveConfigs").action(async () => {
  const wallet = loadKeypair(defaultKeypairLocation);
  const lendingMarket = keyPairFromB58(keys.lendingMarket);

  for (let i = 0; i < ASSETS.length; i++) {
    const reserve = keyPairFromB58(keys.reserves[ASSETS[i]]);
    const oracle = keyPairFromB58(keys.oracles[ASSETS[i]]);

    const configBytes = getReserveConfig(
      oracle.publicKey,
      ASSETS[i],
      PRICES[i],
      4
    );

    const ix = createUpdateEntireReserveConfigInstruction(
      {
        lendingMarketOwner: wallet.publicKey,
        lendingMarket: lendingMarket.publicKey,
        reserve: reserve.publicKey,
      },
      {
        mode: 25,
        value: configBytes,
      }
    );

    let tx = new Transaction().add(ix);
    let signature = await shyft.connection.sendTransaction(tx, [wallet]);
    console.log({ signature, asset: ASSETS[i] });
  }
});

cli
  .command("refreshReserve")
  .argument("<ticker>", "ticker of asset")
  .action(async (ticker) => {
    const wallet = loadKeypair(defaultKeypairLocation);
    const lendingMarket = keyPairFromB58(keys.lendingMarket);

    const reserve = keyPairFromB58(keys.reserves[ticker]);
    const oracle = keyPairFromB58(keys.oracles[ticker]);

    const ix = createRefreshReserveInstruction({
      reserve: reserve.publicKey,
      lendingMarket: lendingMarket.publicKey,
      pythOracle: oracle.publicKey,
    });

    let tx = new Transaction().add(ix);
    let signature = await shyft.connection.sendTransaction(tx, [wallet]);
    console.log({ signature, ticker });
  });

cli.command("mintTokens").action(async () => {
  const wallet = loadKeypair(defaultKeypairLocation);
  const userKeys = Object.values(keys.users);

  const mints = {
    USDC: "G1oSn38tx54RsruDY68as9PsPAryKYh63q6g29JJ5AmJ",
    USDT: "5CWwsNUwCNkz2d8VFLQ6FdJGAxjjJEY1EEjSBArHjVKn",
    SOL: "So11111111111111111111111111111111111111112",
    JitoSOL: "hnfoBeesFnbNQupjFpE8MSS2LpJ3zGeqEkmfPYqwXV1",
    mSOL: "DHEiD7eew9gnaRujuEM5PR9SbvKdhSoS91dRJm7rKYMS",
    bSOL: "Hck546Ds2XdnqLYfR2Mp7N4vbFtMecF3sgHVFZ2s9yYc",
  };

  for (let i = 0; i < userKeys.length; i++) {
    const user = keyPairFromB58(userKeys[i]);
    const ticker = ASSETS[i];
    const mint = new PublicKey(mints[ticker]);

    console.log(`minting for ${user.publicKey} (${ticker})`);

    const ata = await getOrCreateAssociatedTokenAccount(
      shyft.connection,
      user,
      mint,
      user.publicKey
    );

    await mintTo(
      shyft.connection,
      wallet,
      mint,
      ata.address,
      wallet,
      i < 1 ? 100e9 : 10000e6
    );
  }
});

cli.command("userDeposit").action(async () => {
  const wallet = loadKeypair(defaultKeypairLocation);
  const lendingMarket = keyPairFromB58(keys.lendingMarket);

  const i = 0;
  const createObligation = true;

  const user = keyPairFromB58(keys.users[`${i}`]);
  console.log(`depositing for user ${user.publicKey.toBase58()}`);

  const reserveKey = keyPairFromB58(keys.reserves[ASSETS[i]]);
  const reserve = await Reserve.fromAccountAddress(
    shyft.connection,
    reserveKey.publicKey
  );
  const oracle = keyPairFromB58(keys.oracles[ASSETS[i]]);

  const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
    KLEND_PROGRAM_ID
  );

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.publicKey.toBuffer()],
    PROGRAM_ID
  );

  const [userMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_meta"), bestlendUserAccount.toBuffer()],
    KLEND_PROGRAM_ID
  );

  // user account PDA ATAs
  const collateralAta = await getOrCreateAssociatedTokenAccount(
    shyft.connection,
    wallet,
    reserve.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );
  const liquidityAta = await getOrCreateAssociatedTokenAccount(
    shyft.connection,
    wallet,
    reserve.liquidity.mintPubkey,
    bestlendUserAccount,
    true
  );
  const userLiquidityAta = await getOrCreateAssociatedTokenAccount(
    shyft.connection,
    wallet,
    reserve.liquidity.mintPubkey,
    user.publicKey
  );

  const [obligation] = PublicKey.findProgramAddressSync(
    [
      Uint8Array.from([0]),
      Uint8Array.from([0]),
      bestlendUserAccount.toBuffer(),
      lendingMarket.publicKey.toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ],
    KLEND_PROGRAM_ID
  );

  const tx = new Transaction();

  if (createObligation) {
    const recentSlot = await shyft.connection.getSlot("finalized");

    const [lookupTableIx, lookupTableAddress] =
      AddressLookupTableProgram.createLookupTable({
        authority: user.publicKey,
        payer: user.publicKey,
        recentSlot: recentSlot,
      });

    tx.add(lookupTableIx);

    tx.add(
      createInitAccountInstruction(
        {
          owner: user.publicKey,
          bestlendUserAccount,
        },
        {
          collateralGroup: 0,
          debtGroup: 1,
          lookupTable: lookupTableAddress,
        }
      )
    );

    tx.add(
      createInitKlendAccountInstruction({
        owner: user.publicKey,
        bestlendUserAccount,
        obligation,
        lendingMarket: lendingMarket.publicKey,
        seed1Account: PublicKey.default,
        seed2Account: PublicKey.default,
        userMetadata: userMetadata,
        klendProgram: KLEND_PROGRAM_ID,
      })
    );
  }

  tx.add(
    createRefreshReserveInstruction({
      reserve: reserveKey.publicKey,
      lendingMarket: lendingMarket.publicKey,
      pythOracle: oracle.publicKey,
    })
  );

  tx.add(
    createRefreshObligationInstruction({
      lendingMarket: lendingMarket.publicKey,
      obligation,
    })
  );

  tx.add(
    createKlendDepositInstruction(
      {
        signer: user.publicKey,
        bestlendUserAccount,
        obligation,
        klendProgram: KLEND_PROGRAM_ID,
        lendingMarket: lendingMarket.publicKey,
        lendingMarketAuthority,
        reserve: reserveKey.publicKey,
        reserveLiquiditySupply: reserve.liquidity.supplyVault,
        reserveCollateralMint: reserve.collateral.mintPubkey,
        reserveDestinationDepositCollateral: reserve.collateral.supplyVault,
        userSourceLiquidity: userLiquidityAta.address,
        bestlendUserSourceLiquidity: liquidityAta.address,
        userDestinationCollateral: collateralAta.address,
        instructionSysvarAccount: new PublicKey(
          "Sysvar1nstructions1111111111111111111111111"
        ),
      },
      {
        amount: i > 1 ? 5e9 : 5e6,
      }
    )
  );

  let signature = await shyft.connection.sendTransaction(tx, [wallet, user]);
  console.log({ signature, targetIndex: i });
});

const loadKeypair = (filename: string) => {
  const walletKey = JSON.parse(fs.readFileSync(filename, "utf-8"));
  let secretKey = Uint8Array.from(walletKey as number[]);
  return Keypair.fromSecretKey(secretKey);
};

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

cli.parse(process.argv);
