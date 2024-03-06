import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { keys } from '../keys'
import { KaminoLending } from '../target/types/kamino_lending';
import { PublicKey } from "@solana/web3.js";
import { keyPairFromB58 } from "./utils";

const klend = anchor.workspace.KaminoLending as Program<KaminoLending>;
const lendingMarket = keyPairFromB58(keys.lendingMarket)

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
    }
}

export { lendingMarket, lendingMarketAuthority, reservePDAs }
