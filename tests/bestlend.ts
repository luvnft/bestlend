import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bestlend } from "../target/types/bestlend";
import { KaminoLending } from "../target/types/kamino_lending";
import { MockPyth } from "../target/types/mock_pyth";
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createMint, mintTo } from "@solana/spl-token";
import { BN } from "bn.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { keys } from '../keys'
import { lendingMarket, lendingMarketAuthority, reservePDAs } from "./accounts";
import { getReserveConfig } from "./configs";

const ASSETS = [
  "USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"
]
const PRICES = [
  9998, 9977, 1267000, 1372000, 1471000, 1403000
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

      await addSol(provider, users[i].publicKey);
      mints.push(await mintToken(connection, users[i], ASSETS[i], keyPairFromB58(keys.mints[ASSETS[i]])));
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

    describe("initReserve", async () => {
      for (let i = 0; i < numReserves; i++) {
        it(`mint ${i + 1}`, async () => {
          const mint = mints[i];
          const reserve = reserves[i];

          const {
            feeReceiver,
            reserveLiquiditySupply,
            reserveCollateralMint,
            reserveCollateralSupply,
          } = reservePDAs(mint)

          const size = 8616 + 8;
          const minBalance = await connection.getMinimumBalanceForRentExemption(
            size
          );
          const createReserveAccountTx = SystemProgram.createAccount({
            fromPubkey: signer.publicKey,
            newAccountPubkey: reserve.publicKey,
            lamports: minBalance,
            space: size,
            programId: klend.programId,
          });

          const tx = new Transaction().add(createReserveAccountTx);
          await sendAndConfirmTransaction(connection, tx, [
            signer.payer,
            reserve,
          ]);

          await klend.methods
            .initReserve()
            .accounts({
              lendingMarketOwner: signer.publicKey,
              lendingMarket: lendingMarket.publicKey,
              lendingMarketAuthority,
              reserve: reserve.publicKey,
              reserveLiquidityMint: mint,
              feeReceiver,
              reserveLiquiditySupply,
              reserveCollateralMint,
              reserveCollateralSupply,
            })
            .rpc({ skipPreflight: true });
        });
      }
    });

    describe("updateReserveConfig", async () => {
      for (let i = 0; i < numReserves; i++) {
        it(`mint ${i + 1}`, async () => {
          const reserve = reserves[i];
          const configBytes = getReserveConfig(oracles[i].publicKey, ASSETS[i])

          await klend.methods
            .updateEntireReserveConfig(new BN(25), configBytes)
            .accounts({
              lendingMarketOwner: signer.publicKey,
              lendingMarket: lendingMarket.publicKey,
              reserve: reserve.publicKey,
            })
            .rpc();
        });
      }
    });
  })
});

export const keyPairFromB58 = (s: string): Keypair => {
  return Keypair.fromSecretKey(bs58.decode(s))
}

const addSol = async (
  provider: anchor.Provider,
  wallet: anchor.web3.PublicKey,
  amount = 10 * anchor.web3.LAMPORTS_PER_SOL
) => {
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(wallet, amount),
    "confirmed"
  );
};

const mintToken = async (connection: Connection, owner: Keypair, ticker: string, keypair: Keypair) => {
  const dec = ticker.includes("USD") ? 6 : 9
  const mint = await createMint(connection, owner, owner.publicKey, null, dec, keypair);

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    owner.publicKey
  );

  await mintTo(connection, owner, mint, ata.address, owner.publicKey, 1e10);
  return mint;
};