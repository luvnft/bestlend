import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { keys } from '../keys'
import { KaminoLending } from '../target/types/kamino_lending';
import { keyPairFromB58 } from './bestlend';
import { PublicKey } from "@solana/web3.js";

const klend = anchor.workspace.KaminoLending as Program<KaminoLending>;

const lendingMarket = keyPairFromB58(keys.lendingMarket)
const [lendingMarketAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("lma"), lendingMarket.publicKey.toBuffer()],
    klend.programId
);

export { lendingMarket, lendingMarketAuthority }