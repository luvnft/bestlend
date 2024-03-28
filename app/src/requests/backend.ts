import { ASSETS_MINTS } from "@/utils/consts";
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

type Position = {
  reserveAddress: PublicKey;
  mint: PublicKey;
  amount: number;
  amountBase: number;
  marketValue: number;
};

export type KlendObligation = {
  borrows: Position[];
  deposits: Position[];
  ltv: number;
  pda: PublicKey;
  nav: number;
  effectiveAPY: number;
};

export const getObligation = async (
  user: PublicKey
): Promise<KlendObligation> => {
  const { data } = await axiosInstance.get(
    `/klend/obligation?pubkey=${user.toBase58()}`
  );
  const obligation = data?.obligation ?? {};
  return {
    borrows: obligation.borrows?.map((b: any) => ({
      reserveAddress: new PublicKey(b.reserveAddress),
      mint: new PublicKey(b.mintAddress),
      amountBase: parseFloat(b.amount),
      amount: parseFloat(b.amount) / 10 ** ASSETS_MINTS[b.mintAddress].decimals,
      marketValue: parseFloat(b.marketValueRefreshed),
    })),
    deposits: obligation.deposits?.map((b: any) => ({
      reserveAddress: new PublicKey(b.reserveAddress),
      mint: new PublicKey(b.mintAddress),
      amountBase: parseFloat(b.amount),
      amount: parseFloat(b.amount) / 10 ** ASSETS_MINTS[b.mintAddress].decimals,
      marketValue: parseFloat(b.marketValueRefreshed),
    })),
    ltv: parseFloat(obligation?.ltv),
    pda: new PublicKey(obligation?.pda),
    nav: parseFloat(obligation?.nav),
    effectiveAPY: parseFloat(obligation?.effectiveAPY),
  };
};

export type ActionUpdate = {
  updates: boolean;
  message: string;
  details: string;
  ts: string;
};

export const getActionUpdate = async (
  user: PublicKey
): Promise<ActionUpdate> => {
  const { data } = await axiosInstance.get(
    `/bestlend/updateCheck?pubkey=${user.toBase58()}`
  );
  return data ?? {};
};

export const getStakingRates = async (): Promise<{ [key: string]: string }> => {
  const { data } = await axiosInstance.get("/bestlend/stakingRates");
  return data ?? {};
};

export const getSolanaPrice = async (): Promise<number> => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=USD"
  );
  return data?.solana.usd;
};
