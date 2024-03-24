import * as anchor from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";

export const keyPairFromB58 = (s: string): Keypair => {
  return Keypair.fromSecretKey(bs58.decode(s));
};

export const airdrop = async (
  provider: anchor.Provider,
  wallet: anchor.web3.PublicKey,
  amount = 10 * anchor.web3.LAMPORTS_PER_SOL
) => {
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(wallet, amount),
    "confirmed"
  );
};

export const mintToken = async (
  connection: Connection,
  owner: Keypair,
  ticker: string,
  keypair: Keypair,
  users?: PublicKey[],
  signer?: Keypair
) => {
  const dec = ticker.includes("USD") ? 6 : 9;
  const mint = await createMint(
    connection,
    signer,
    owner.publicKey,
    null,
    dec,
    keypair
  );

  for (let user of [...(users || []), owner.publicKey, signer.publicKey]) {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mint,
      user
    );
    await mintTo(connection, owner, mint, ata.address, owner, 1e10);
  }

  return mint;
};
