require("dotenv").config();
import { Command } from "commander";
import {
  Transaction,
  Keypair,
  sendAndConfirmTransaction as sendTx,
} from "@solana/web3.js";
import fs from "fs";
import { keys } from "../keys";
import { keyPairFromB58 } from "../tests/utils";
import { ShyftSdk, Network } from "@shyft-to/js";
import { createWritePythPriceInstruction } from "../clients/mock-pyth/src";

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
  .option(
    "-kp, --keypair <keypair>",
    "location of keypair",
    defaultKeypairLocation
  )
  .action(async (ticker, price, decimals, optional) => {
    const wallet = loadKeypair(optional.keypair);

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

const loadKeypair = (filename: string) => {
  const walletKey = JSON.parse(fs.readFileSync(filename, "utf-8"));
  let secretKey = Uint8Array.from(walletKey as number[]);
  return Keypair.fromSecretKey(secretKey);
};

cli.parse(process.argv);
