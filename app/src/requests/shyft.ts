import { ASSETS } from "@/utils/consts";
import { Asset } from "@/utils/models";
import {
  ShyftSdk,
  Network,
  TokenBalance as ShyftTokenBalance,
} from "@shyft-to/js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "react-query";

const shyft = new ShyftSdk({
  apiKey: process.env.NEXT_PUBLIC_SHYFT_KEY ?? "",
  network: Network.Devnet,
});

export type TokenBalance = ShyftTokenBalance & {
  internal: Asset;
  isNative: boolean;
};

export const useGetTokenBalances = (): {
  isLoading: boolean;
  tokenBalances: TokenBalance[];
} => {
  const { publicKey } = useWallet();

  const query = useQuery(
    "getAllTokenBalance",
    () =>
      shyft.wallet.getAllTokenBalance({
        wallet: publicKey?.toBase58() ?? "",
      }),
    { enabled: !!publicKey }
  );

  const querySOL = useQuery(
    "getBalance",
    () =>
      shyft.wallet.getBalance({
        wallet: publicKey?.toBase58() ?? "",
      }),
    { enabled: !!publicKey }
  );

  // attach internal data and combine SOL balance
  const allTokenBalances: TokenBalance[] = [
    ...(query.data?.map((entry) => ({
      ...entry,
      internal: ASSETS[entry.info.symbol],
      isNative: false,
    })) ?? []),
    {
      address: "So11111111111111111111111111111111111111112",
      balance: querySOL.data ?? 0,
      associated_account: "",
      info: {
        name: "Solana",
        symbol: "SOL",
        image: "https://assets.geckoterminal.com/ttmzp815hr8hanm6bwxp549dq9rp",
      },
      internal: ASSETS["SOL"],
      isNative: true,
    },
  ];

  // filter out assets that aren't supported
  const tokenBalances = allTokenBalances.filter((b) => !!b.internal);

  return {
    isLoading: query.isLoading || querySOL.isLoading,
    tokenBalances,
  };
};
