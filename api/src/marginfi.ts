import { PublicKey } from "@solana/web3.js";

export const marginfiMarket = async (req, res) => {
  return {
    reserves: [
      {
        address: PublicKey.unique(),
        symbol: "JitoSOL",
        available: "0",
        marketPrice: "215.37",
        depositTvl: "0",
        borrowedTvl: "0",
        supplyAPR: 0.0005,
        borrowAPR: 0.007,
        mint: "hnfoBeesFnbNQupjFpE8MSS2LpJ3zGeqEkmfPYqwXV1",
      },
      {
        address: PublicKey.unique(),
        symbol: "mSOL",
        available: "0",
        marketPrice: "230.89",
        depositTvl: "0",
        borrowedTvl: "0",
        supplyAPR: 0.0003,
        borrowAPR: 0.0068,
        mint: "DHEiD7eew9gnaRujuEM5PR9SbvKdhSoS91dRJm7rKYMS",
      },
      {
        address: PublicKey.unique(),
        symbol: "USDC",
        available: "0",
        marketPrice: "230.89",
        depositTvl: "0",
        borrowedTvl: "0",
        supplyAPR: 0.0285,
        borrowAPR: 0.0322,
        mint: "G1oSn38tx54RsruDY68as9PsPAryKYh63q6g29JJ5AmJ",
      },
    ],
  };
};
