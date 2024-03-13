import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { Bestlend } from "../target/types/bestlend";
import { KaminoLending } from "../target/types/kamino_lending";
import { MockPyth } from "../target/types/mock_pyth";
import { DummySwap } from "../target/types/dummy_swap";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction as sendTx,
  Transaction,
} from "@solana/web3.js";
import fs from "fs";
import { BN, Program } from "@coral-xyz/anchor";
import { keys } from "../keys";
import { keyPairFromB58 } from "../tests/utils";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const defaultKeypairLocation = "/home/sc4recoin/.config/solana/id.json";

const program = anchor.workspace.Bestlend as Program<Bestlend>;
const klend = anchor.workspace.KaminoLending as Program<KaminoLending>;
const oracleProgram = anchor.workspace.MockPyth as Program<MockPyth>;
const dummySwap = anchor.workspace.DummySwap as Program<DummySwap>;

const cli = new Command();

const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

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

const loadKeypair = (filename: string) => {
  const walletKey = JSON.parse(fs.readFileSync(filename, "utf-8"));
  let secretKey = Uint8Array.from(walletKey as number[]);
  return Keypair.fromSecretKey(secretKey);
};

cli.parse(process.argv);
