import { Connection } from "@solana/web3.js";

const rpc = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`;
export const connection = new Connection(rpc, "confirmed");
