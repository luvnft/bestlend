import { PublicKey } from "@solana/web3.js";

export type Asset = {
  mint: PublicKey;
  asset_group: AssetGroup;
  ticker: string;
  oracle: PublicKey;
  decimals: number;
  iconURL: string;
};

export enum AssetGroup {
  STABLE,
  LST,
}

export enum LendingMarket {
  KAMINO,
  MARGINFI,
  SOLEND,
}
