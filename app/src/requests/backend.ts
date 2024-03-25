import { PublicKey, Transaction } from "@solana/web3.js";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
});

export type KlendReserve = {
  address: string;
  symbol: string;
  available: string;
  marketPrice: string;
  depositTvl: string;
  borrowedTvl: string;
  supplyAPR: number;
  borrowAPR: number;
  mint: string;
};

export const getKlendReserves = async (): Promise<KlendReserve[]> => {
  const { data } = await axiosInstance.get("/klend/market");
  return data?.reserves;
};

export const getDepositTx = async (
  reserve: string,
  user: PublicKey,
  amount: number,
  ticker: string
): Promise<Transaction> => {
  const { data } = await axiosInstance.post("/txs/deposit", {
    pubkey: user.toBase58(),
    reserve,
    amount,
    ticker,
  });
  return Transaction.from(Buffer.from(data?.tx, "base64"));
};
