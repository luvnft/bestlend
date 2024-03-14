require("dotenv").config();
import { Command } from "commander";
import {
  Transaction,
  Keypair,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import fs from "fs";
import { keys } from "../keys";
import { keyPairFromB58 } from "../tests/utils";
import { ShyftSdk, Network } from "@shyft-to/js";
import { createWritePythPriceInstruction } from "../clients/mock-pyth/src";
import {
  PROGRAM_ID as KLEND_PROGRAM_ID,
  createInitLendingMarketInstruction,
  createInitReserveInstruction,
} from "../clients/klend/src";

const defaultKeypairLocation = "/home/sc4recoin/.config/solana/id.json";
const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

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
    const mint = keyPairFromB58(keys.mints[ticker]);
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
    await sleep(10000);

    const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
      KLEND_PROGRAM_ID
    );

    const [feeReceiver] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee_receiver"),
        lendingMarket.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveLiquiditySupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_liq_supply"),
        lendingMarket.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_mint"),
        lendingMarket.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );
    const [reserveCollateralSupply] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reserve_coll_supply"),
        lendingMarket.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      KLEND_PROGRAM_ID
    );

    let txInit = new Transaction().add(
      createInitReserveInstruction({
        lendingMarketOwner: wallet.publicKey,
        lendingMarket: lendingMarket.publicKey,
        lendingMarketAuthority,
        reserve: reserve.publicKey,
        reserveLiquidityMint: mint.publicKey,
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

const loadKeypair = (filename: string) => {
  const walletKey = JSON.parse(fs.readFileSync(filename, "utf-8"));
  let secretKey = Uint8Array.from(walletKey as number[]);
  return Keypair.fromSecretKey(secretKey);
};

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

cli.parse(process.argv);
