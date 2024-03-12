import { PublicKey } from "@solana/web3.js";
import { Asset, AssetGroup, LendingMarket } from "./models";

export const STABLES: Asset[] = [
  {
    mint: new PublicKey("HXgjmMGyuVgYwr2NByedRGbv3B5PaC35TVXZz9zC37SH"),
    asset_group: AssetGroup.STABLE,
    ticker: "USDC",
    oracle: new PublicKey("8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi"),
    decimals: 6,
    iconURL: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
  },
  {
    mint: new PublicKey("7peGn1vW6ayNk3TiWPELBYah8knv8z2RYG7wNGQavXxF"),
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
    mint: new PublicKey("G56qBhvVSMLXzsFqQ4KjBs72NtQsDwFeRu4pgQYNhnFL"),
    asset_group: AssetGroup.LST,
    ticker: "SOL",
    oracle: new PublicKey("B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU"),
    decimals: 9,
    iconURL:
      "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
  },
  {
    mint: new PublicKey("9k8GwMpTaDf7HW4q34tjXTwwvcdrkWg4Fp9PFrzZzPYE"),
    asset_group: AssetGroup.LST,
    ticker: "JTO",
    oracle: new PublicKey("9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt"),
    decimals: 9,
    iconURL: "https://assets.coingecko.com/coins/images/33228/standard/jto.png",
  },
  {
    mint: new PublicKey("5iaHdCKiChezmE3PfP6STbkXJ8mgXNnZzNny16oKBSi8"),
    asset_group: AssetGroup.LST,
    ticker: "mSOL",
    oracle: new PublicKey("5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p"),
    decimals: 9,
    iconURL:
      "https://assets.coingecko.com/coins/images/17752/standard/mSOL.png",
  },
  {
    mint: new PublicKey("8jVkW4NZBs5HJdYwJdVsfSuvkMfWTGoTQqfm3m45g5Hh"),
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
    USDC: "HXgjmMGyuVgYwr2NByedRGbv3B5PaC35TVXZz9zC37SH",
    USDT: "7peGn1vW6ayNk3TiWPELBYah8knv8z2RYG7wNGQavXxF",
    SOL: "G56qBhvVSMLXzsFqQ4KjBs72NtQsDwFeRu4pgQYNhnFL",
    JitoSOL: "9k8GwMpTaDf7HW4q34tjXTwwvcdrkWg4Fp9PFrzZzPYE",
    mSOL: "5iaHdCKiChezmE3PfP6STbkXJ8mgXNnZzNny16oKBSi8",
    bSOL: "8jVkW4NZBs5HJdYwJdVsfSuvkMfWTGoTQqfm3m45g5Hh",
  },
  reserves: {
    USDC: "FY7KxqjJpCxrtUJGqzMUooq3hRqZ55sLyQT5ajtmmmAM",
    USDT: "823zL3Df7BWPYWNAfaWSB37Vo8N3q5iGeJVUtenroQ8K",
    SOL: "2T75Yu4pETZc9cQWGAVtcMaRdosF1HTC1CxKFzB9vkap",
    JitoSOL: "D46csfimCRAktqojTPHLoAPf3CXsWiMpnnedREbbKdzQ",
    mSOL: "9zANAieNCYpaZE9GeFsVhAJSDHgZvGGtKpeHiRGgaChP",
    bSOL: "6G7UXhFn94RyYKCbfnCPZLaUyv3EVEKgtTgDP6UDqVjH",
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
