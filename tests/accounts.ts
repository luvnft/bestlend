import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { keys } from '../keys'
import { KaminoLending } from '../target/types/kamino_lending';
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { keyPairFromB58 } from "./utils";
import { Bestlend } from "../target/types/bestlend";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Reserve } from "../clients/klend/src";

const program = anchor.workspace.Bestlend as Program<Bestlend>;
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
        obligation
    }
}

export const reserveAccounts = async (connection: Connection, user: Keypair, reserveKey: PublicKey) => {
    const reserve = await Reserve.fromAccountAddress(connection, reserveKey);

    const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("bestlend_user_account"), user.publicKey.toBuffer()],
        program.programId
    );

    // user account PDA ATAs
    const collateralAta = await getOrCreateAssociatedTokenAccount(
        connection,
        user,
        reserve.collateral.mintPubkey,
        bestlendUserAccount,
        true
    );
    const liquidityAta = await getOrCreateAssociatedTokenAccount(
        connection,
        user,
        reserve.liquidity.mintPubkey,
        bestlendUserAccount,
        true
    );
    const userLiquidityAta = await getOrCreateAssociatedTokenAccount(
        connection,
        user,
        reserve.liquidity.mintPubkey,
        user.publicKey,
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
        obligation
    }
}

export { lendingMarket, lendingMarketAuthority, reservePDAs }
