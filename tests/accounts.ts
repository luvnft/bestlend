import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { keys } from "../keys";
import { KaminoLending } from "../target/types/kamino_lending";
import {
  PublicKey,
  Connection,
  Keypair,
  Signer,
  AccountMeta,
} from "@solana/web3.js";
import { keyPairFromB58 } from "./utils";
import { Bestlend } from "../target/types/bestlend";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Reserve } from "../clients/klend/src";
import { DummySwap } from "../target/types/dummy_swap";

const program = anchor.workspace.Bestlend as Program<Bestlend>;
const klend = anchor.workspace.KaminoLending as Program<KaminoLending>;
const dummySwap = anchor.workspace.DummySwap as Program<DummySwap>;
const lendingMarket = keyPairFromB58(keys.lendingMarket);

const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
  [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
  klend.programId
);

const reservePDAs = (mint: PublicKey) => {
  const [feeReceiver] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("fee_receiver"),
      lendingMarket.publicKey.toBuffer(),
      mint.toBuffer(),
    ],
    klend.programId
  );
  const [reserveLiquiditySupply] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("reserve_liq_supply"),
      lendingMarket.publicKey.toBuffer(),
      mint.toBuffer(),
    ],
    klend.programId
  );
  const [reserveCollateralMint] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("reserve_coll_mint"),
      lendingMarket.publicKey.toBuffer(),
      mint.toBuffer(),
    ],
    klend.programId
  );
  const [reserveCollateralSupply] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("reserve_coll_supply"),
      lendingMarket.publicKey.toBuffer(),
      mint.toBuffer(),
    ],
    klend.programId
  );
  return {
    feeReceiver,
    reserveLiquiditySupply,
    reserveCollateralMint,
    reserveCollateralSupply,
  };
};

export const userPDAs = (user: PublicKey) => {
  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    program.programId
  );
  const [userMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_meta"), bestlendUserAccount.toBuffer()],
    klend.programId
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
    klend.programId
  );
  return {
    bestlendUserAccount,
    userMetadata,
    obligation,
  };
};

const reserveAccounts = async (
  connection: Connection,
  user: Keypair,
  reserveKey: PublicKey,
  performer?: Keypair
) => {
  const reserve = await Reserve.fromAccountAddress(connection, reserveKey);
  const payer = performer ?? user;

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.publicKey.toBuffer()],
    program.programId
  );

  // user account PDA ATAs
  const collateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    reserve.collateral.mintPubkey,
    bestlendUserAccount,
    true
  );
  const liquidityAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    reserve.liquidity.mintPubkey,
    bestlendUserAccount,
    true
  );
  const userLiquidityAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    reserve.liquidity.mintPubkey,
    payer.publicKey,
    true
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
    klend.programId
  );

  return {
    bestlendUserAccount,
    reserve,
    collateralAta,
    liquidityAta,
    userLiquidityAta,
    obligation,
  };
};

const accountValueRemainingAccounts = async (
  connection: Connection,
  signer: Signer,
  user: PublicKey,
  mints: PublicKey[],
  oracles: PublicKey[]
) => {
  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    program.programId
  );

  const remainingAccounts: AccountMeta[] = [];
  for (let i = 0; i < oracles.length; i++) {
    const { address } = await getOrCreateAssociatedTokenAccount(
      connection,
      signer,
      mints[i],
      bestlendUserAccount,
      true
    );
    remainingAccounts.push({
      pubkey: oracles[i],
      isSigner: false,
      isWritable: false,
    });
    remainingAccounts.push({
      pubkey: address,
      isSigner: false,
      isWritable: false,
    });
  }

  return remainingAccounts;
};

const swapAccounts = async (
  connection: Connection,
  inputMint: PublicKey,
  outputMint: PublicKey,
  user: Keypair
) => {
  const [tokenPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_holder")],
    dummySwap.programId
  );
  const { address: inputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    inputMint,
    user.publicKey,
    true
  );
  const { address: outputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    outputMint,
    user.publicKey,
    true
  );
  const { address: pdaInputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    inputMint,
    tokenPDA,
    true
  );
  const { address: pdaOutputATA } = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
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

export {
  lendingMarket,
  lendingMarketAuthority,
  reservePDAs,
  reserveAccounts,
  accountValueRemainingAccounts,
  swapAccounts,
};
