import { PublicKey } from "@solana/web3.js";
import { Asset, AssetGroup, LendingMarket } from "./models";

export const STABLES: Asset[] = [
  {
    mint: new PublicKey("G1oSn38tx54RsruDY68as9PsPAryKYh63q6g29JJ5AmJ"),
    asset_group: AssetGroup.STABLE,
    ticker: "USDC",
    oracle: new PublicKey("8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi"),
    decimals: 6,
    iconURL: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
  },
  {
    mint: new PublicKey("5CWwsNUwCNkz2d8VFLQ6FdJGAxjjJEY1EEjSBArHjVKn"),
    asset_group: AssetGroup.STABLE,
    ticker: "USDT",
    oracle: new PublicKey("DoYnB3k4dfDmh3tgZvUUCsd9548CWBhAJwzyKWiDDj5f"),
    decimals: 6,
    iconURL:
      "https://assets.coingecko.com/coins/images/325/standard/Tether.png",
  },
];

export const LSTS: Asset[] = [
  {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    asset_group: AssetGroup.LST,
    ticker: "SOL",
    oracle: new PublicKey("B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU"),
    decimals: 9,
    iconURL:
      "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
  },
  {
    mint: new PublicKey("hnfoBeesFnbNQupjFpE8MSS2LpJ3zGeqEkmfPYqwXV1"),
    asset_group: AssetGroup.LST,
    ticker: "JTO",
    oracle: new PublicKey("9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt"),
    decimals: 9,
    iconURL: "https://assets.coingecko.com/coins/images/33228/standard/jto.png",
  },
  {
    mint: new PublicKey("DHEiD7eew9gnaRujuEM5PR9SbvKdhSoS91dRJm7rKYMS"),
    asset_group: AssetGroup.LST,
    ticker: "mSOL",
    oracle: new PublicKey("5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p"),
    decimals: 9,
    iconURL:
      "https://assets.coingecko.com/coins/images/17752/standard/mSOL.png",
  },
  {
    mint: new PublicKey("Hck546Ds2XdnqLYfR2Mp7N4vbFtMecF3sgHVFZ2s9yYc"),
    asset_group: AssetGroup.LST,
    ticker: "bSOL",
    oracle: new PublicKey("FBwd4ar6hQugVXjzX21SABSLXtzoJ5rnyb6bQBkFLyMp"),
    decimals: 9,
    iconURL:
      "https://assets.coingecko.com/coins/images/26636/standard/blazesolana.png",
  },
];

export const ASSETS = Object.fromEntries(
  [...STABLES, ...LSTS].map((asset) => [asset.ticker, asset])
);

export const ASSETS_MINTS = Object.fromEntries(
  [...STABLES, ...LSTS].map((asset) => [asset.mint, asset])
);

export const PUBKEYS = {
  oracles: {
    USDC: "8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi",
    USDT: "DoYnB3k4dfDmh3tgZvUUCsd9548CWBhAJwzyKWiDDj5f",
    SOL: "B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU",
    JitoSOL: "9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt",
    mSOL: "5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p",
    bSOL: "FBwd4ar6hQugVXjzX21SABSLXtzoJ5rnyb6bQBkFLyMp",
  },
  mints: {
    USDC: "G1oSn38tx54RsruDY68as9PsPAryKYh63q6g29JJ5AmJ",
    USDT: "5CWwsNUwCNkz2d8VFLQ6FdJGAxjjJEY1EEjSBArHjVKn",
    SOL: "So11111111111111111111111111111111111111112",
    JitoSOL: "hnfoBeesFnbNQupjFpE8MSS2LpJ3zGeqEkmfPYqwXV1",
    mSOL: "DHEiD7eew9gnaRujuEM5PR9SbvKdhSoS91dRJm7rKYMS",
    bSOL: "Hck546Ds2XdnqLYfR2Mp7N4vbFtMecF3sgHVFZ2s9yYc",
  },
  reserves: {
    USDC: "GaCnWqvQSnLRrq2WG7qYDSdy3GZWPj3LDrrPgP6CvKRf",
    USDT: "2VdhFUZqZ3yKxfT8aXwNXj9g7UpxZ3KegRqRV8d2Bv8V",
    SOL: "7jeNhz5pQhnewxSrpPhgBDbaJKvzCervsyqm5pKL86UL",
    JitoSOL: "DhSnsVombww6yFD5MUg91xEP75qyXgDPJnR4faQKonqk",
    mSOL: "7AZCu3Fwqi5JQT3jve7DWBxgoCGPek2Xcpo4xGxz8BhV",
    bSOL: "5ddtzRMHNhttv77oBHC3A4RAv4bGHfmdzqW5EmPwXBzw",
  },
  lendingMarket: "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn",
  performer: "C83QhmGAAA6BAGhVaL7sU5tyBNsQurPMZTuL36a3uM51",
};

export const getMarketIcon = (market: LendingMarket) => {
  switch (market) {
    case LendingMarket.KAMINO:
      return "https://www.gitbook.com/cdn-cgi/image/width=36,dpr=2,height=36,fit=contain,format=auto/https%3A%2F%2F1424764656-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fcollections%252FVStun9gPCuY89Ny0cWJh%252Ficon%252FCl1b8258ZYNv8Sd45Nyy%252FKamino%2520Twitter%2520Logo.png%3Falt%3Dmedia%26token%3D4f444b58-5cb8-4b3b-842b-37acc720e5b2";
    case LendingMarket.MARGINFI:
      return "https://www.marginfi.com/_next/image?url=%2Fmarginfi_logo.png";
    case LendingMarket.SOLEND:
      return "https://solend.fi/assets/tokens/slnd.png";
  }
};
