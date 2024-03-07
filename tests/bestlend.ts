import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bestlend } from "../target/types/bestlend";
import { KaminoLending } from "../target/types/kamino_lending";
import { MockPyth } from "../target/types/mock_pyth";
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { BN } from "bn.js";
import { keys } from '../keys'
import { lendingMarket, lendingMarketAuthority, reserveAccounts, reservePDAs, userPDAs } from "./accounts";
import { getReserveConfig } from "./configs";
import { airdrop, keyPairFromB58, mintToken } from "./utils";
import { PROGRAM_ID as KLEND_PROGRAM_ID, createRefreshObligationInstruction, createRefreshReserveInstruction } from "../clients/klend/src";

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

      await airdrop(provider, users[i].publicKey);
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
        it(ASSETS[i], async () => {
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
        it(ASSETS[i], async () => {
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

  describe("bestlend", async () => {
    it("init account", async () => {
      const user = users[0]

      const {
        bestlendUserAccount,
        userMetadata,
        obligation
      } = userPDAs(user.publicKey)

      await program.methods.initAccount(0, 1)
        .accounts({
          owner: user.publicKey,
          bestlendUserAccount,
        })
        .signers([user])
        .rpc();

      await program.methods.initKlendAccount()
        .accounts({
          owner: user.publicKey,
          bestlendUserAccount,
          obligation,
          lendingMarket: lendingMarket.publicKey,
          seed1Account: PublicKey.default,
          seed2Account: PublicKey.default,
          userMetadata: userMetadata,
          klendProgram: KLEND_PROGRAM_ID
        })
        .signers([user])
        .rpc();
    });

    it("deposit", async () => {
      const user = users[0]
      const reserveKey = reserves[0]
      const oracle = oracles[0]

      const {
        bestlendUserAccount,
        reserve,
        collateralAta,
        liquidityAta,
        userLiquidityAta,
        obligation
      } = await reserveAccounts(connection, user, reserveKey.publicKey);

      const tx = new Transaction()

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
        await program.methods
          .klendDeposit(new BN(1e9))
          .accounts({
            signer: user.publicKey,
            bestlendUserAccount,
            obligation,
            klendProgram: KLEND_PROGRAM_ID,
            lendingMarket: lendingMarket.publicKey,
            lendingMarketAuthority,
            reserve: reserveKey.publicKey,
            reserveLiquiditySupply: reserve.liquidity.supplyVault,
            reserveCollateralMint: reserve.collateral.mintPubkey,
            reserveDestinationDepositCollateral:
              reserve.collateral.supplyVault,
            userSourceLiquidity: userLiquidityAta.address,
            bestlendUserSourceLiquidity: liquidityAta.address,
            userDestinationCollateral: collateralAta.address,
            instructionSysvarAccount: new PublicKey(
              "Sysvar1nstructions1111111111111111111111111"
            ),
          })
          .signers([user])
          .instruction()
      );

      await sendAndConfirmTransaction(connection, tx, [user], { skipPreflight: true });
    })
  });
});
