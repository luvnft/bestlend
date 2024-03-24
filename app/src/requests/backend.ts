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
