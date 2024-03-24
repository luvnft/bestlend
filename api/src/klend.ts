import {
  KaminoMarket,
  KaminoReserve,
} from "@hubbleprotocol/kamino-lending-sdk";
import { ShyftSdk, Network } from "@shyft-to/js";
import { PublicKey } from "@solana/web3.js";
import { Request, Response } from "express";

const KLEND_MARKET = "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn";
const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

const shyft = new ShyftSdk({
  apiKey: process.env.SHYFT_KEY ?? "",
  network: Network.Devnet,
});

export const klendMarket = async (req: Request, res: Response) => {
  const market = await KaminoMarket.load(
    shyft.connection,
    new PublicKey(KLEND_MARKET),
    new PublicKey("HUHJsverovPJN3sVtv8J8D48fKzeajRtz3Ga4Zmh4RLA")
  );

  await market.loadReserves();

  const reserves = [];
  market.reserves.forEach((res, address) => {
    // ignore irrelevant reserves
    if (!ASSETS.includes(res.getTokenSymbol())) {
      return;
    }

    const dec = res.state.liquidity.mintDecimals.toNumber();
    const mult = 10 ** dec;

    reserves.push({
      address: res.address,
      symbol: res.getTokenSymbol(),
      available: res.getLiquidityAvailableAmount().div(mult),
      marketPrice: res.getOracleMarketPrice(),
      depositTvl: res.getDepositTvl(),
      borrowedTvl: res.getBorrowTvl(),
      supplyAPR: res.calculateSupplyAPR(),
      borrowAPR: res.calculateBorrowAPR(),
      mint: res.getLiquidityMint(),
    });
  });

  res.json({ reserves });
};
