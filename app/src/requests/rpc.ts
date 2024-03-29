import { ASSETS, ASSETS_MINTS } from "@/utils/consts";
import { Asset } from "@/utils/models";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";

export type TokenBalance = Asset & {
  balance: number;
};

export const useGetTokenBalances = (): {
  isLoading: boolean;
  tokenBalances: TokenBalance[];
} => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const query = useQuery(
    ["getAllTokenBalance", publicKey],
    async () => {
      const accounts = await connection.getParsedProgramAccounts(
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        {
          filters: [
            {
              dataSize: 165,
            },
            {
              memcmp: {
                offset: 32,
                bytes: publicKey?.toBase58() ?? "",
              },
            },
          ],
        }
      );

      const balances: TokenBalance[] = [];
      accounts.forEach((account) => {
        const parsedAccountInfo: any = account.account.data;
        const info = parsedAccountInfo["parsed"]["info"];
        const mintAddress: string = info["mint"];
        const tokenBalance: number = info["tokenAmount"]["uiAmount"];

        const asset = ASSETS_MINTS[mintAddress];
        if (!asset) return;

        // ignore wSOL for native
        if (asset.ticker === "SOL") return;

        balances.push({
          ...asset,
          balance: tokenBalance,
        });
      });

      return balances;
    },
    { enabled: !!publicKey }
  );

  const querySOL = useQuery(
    ["getBalance", publicKey],
    () => connection.getBalance(publicKey!),
    { enabled: !!publicKey }
  );

  const tokenBalances = query.data ?? [];
  tokenBalances.push({
    ...ASSETS["SOL"],
    balance: (querySOL.data ?? 0) / LAMPORTS_PER_SOL,
  });

  return {
    isLoading: query.isLoading || querySOL.isLoading,
    tokenBalances,
  };
};
