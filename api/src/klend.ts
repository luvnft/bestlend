import { KaminoMarket } from "@hubbleprotocol/kamino-lending-sdk";
import { PublicKey } from "@solana/web3.js";
import { shyft } from "./connection";

const KLEND_MARKET = "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn";
const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

export const klendMarket = async (req, res) => {
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

  return { reserves };
};
