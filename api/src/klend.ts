import { KaminoMarket } from "@hubbleprotocol/kamino-lending-sdk";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as KLEND_PROGRAM_ID } from "../../clients/klend/src";
import { connection } from "./rpc";
import { PROGRAM_ID } from "../../clients/bestlend/src";

const KLEND_MARKET = "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn";
const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

const useDummyAPYs = true;
const dummyAPY = {
  USDC: [0.0325, 0.0468],
  USDT: [0.0551, 0.0785],
  SOL: [0.0147, 0.0357],
  JitoSOL: [0.0006, 0.0063],
  mSOL: [0.0004, 0.0051],
  bSOL: [0.0017, 0.008],
};

export const klendMarket = async (req, res) => {
  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
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

    const reserveData = {
      address: res.address,
      symbol: res.getTokenSymbol(),
      available: res.getLiquidityAvailableAmount().div(mult),
      marketPrice: res.getOracleMarketPrice(),
      depositTvl: res.getDepositTvl(),
      borrowedTvl: res.getBorrowTvl(),
      supplyAPR: res.calculateSupplyAPR(),
      borrowAPR: res.calculateBorrowAPR(),
      mint: res.getLiquidityMint(),
    };

    if (dummyAPY[reserveData.symbol] && useDummyAPYs) {
      const [supply, borrow] = dummyAPY[reserveData.symbol];
      reserveData.supplyAPR = supply;
      reserveData.borrowAPR = borrow;
    }

    reserves.push(reserveData);
  });

  return { reserves };
};

export const klendObligation = async (req, res) => {
  const { pubkey } = req.query;
  const user = new PublicKey(pubkey);

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  const obligations = await market.getAllUserObligations(bestlendUserAccount);

  const obl = obligations?.[0];
  if (!obl) return {};

  return {
    obligation: {
      borrows: obl.getBorrows() ?? [],
      deposits: obl.getDeposits() ?? [],
      ltv: obl.loanToValue() ?? "0",
      pda: bestlendUserAccount.toBase58(),
    },
  };
};
