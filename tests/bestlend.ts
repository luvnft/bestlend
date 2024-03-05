import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bestlend } from "../target/types/bestlend";
import { KaminoLending } from "../target/types/kamino_lending";
import { MockPyth } from "../target/types/mock_pyth";
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { BN } from "bn.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { keys } from '../keys'
import { lendingMarket, lendingMarketAuthority } from "./accounts";

const ASSETS = [
  "USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"
]
const PRICES = [
  9999, 9877, 1012000, 1052000, 1112000, 1032000
]

describe("bestlend", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const { connection } = provider;
  const signer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Bestlend as Program<Bestlend>;
  const klend = anchor.workspace.KaminoLending as Program<KaminoLending>;
  const oracleProgram = anchor.workspace.MockPyth as Program<MockPyth>;

  const numReserves = ASSETS.length;
  const mints: PublicKey[] = [];
  const reserves: Keypair[] = [];
  const oracles: Keypair[] = [];
  const users: Keypair[] = [];

  before(async () => {
    for (let i = 0; i < numReserves; i++) {
      reserves.push(keyPairFromB58(keys.reserves[ASSETS[i]]));
      oracles.push(keyPairFromB58(keys.oracles[ASSETS[i]]));
      users.push(Keypair.generate());
    }
  });

  describe("setup klend fork", async () => {
    it("updateOraclePrice", async () => {
      const promises = []
      for (let i = 0; i < numReserves; i++) {
        promises.push(oracleProgram.methods
          .writePythPrice(new BN(PRICES[i]), -4, new BN(1), new BN(1))
          .accounts({ target: oracles[i].publicKey, signer: signer.publicKey })
          .signers([signer.payer, oracles[i]])
          .rpc());
      }
      await Promise.all(promises)
    });

    it("initLendingMarket", async () => {
      const quoteCurrency = Array(32).fill(0);
      Buffer.from("USD").forEach((b, i) => (quoteCurrency[i] = b));

      const size = 4656 + 8;
      const minBalance = await connection.getMinimumBalanceForRentExemption(size);
      const createMarketAccountTx = SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: lendingMarket.publicKey,
        lamports: minBalance,
        space: size,
        programId: klend.programId,
      });

      const tx = new Transaction().add(createMarketAccountTx);
      await sendAndConfirmTransaction(connection, tx, [
        signer.payer,
        lendingMarket,
      ]);

      await klend.methods
        .initLendingMarket(quoteCurrency)
        .accounts({
          lendingMarketOwner: signer.publicKey,
          lendingMarket: lendingMarket.publicKey,
          lendingMarketAuthority,
        })
        .rpc();
    });

  })
});

export function keyPairFromB58(s: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(s))
}