import { KaminoMarket } from "@hubbleprotocol/kamino-lending-sdk";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as KLEND_PROGRAM_ID } from "../../clients/klend/src";
import { connection } from "./rpc";
import { PROGRAM_ID } from "../../clients/bestlend/src";
import Decimal from "decimal.js";
import { stakingRates } from "./bestlend";

export const KLEND_MARKET = "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn";
export const ASSETS = ["USDC", "USDT", "SOL", "JitoSOL", "mSOL", "bSOL"];

export const MINTS = {
  G1oSn38tx54RsruDY68as9PsPAryKYh63q6g29JJ5AmJ: "USDC",
  "5CWwsNUwCNkz2d8VFLQ6FdJGAxjjJEY1EEjSBArHjVKn": "USDT",
  So11111111111111111111111111111111111111112: "SOL",
  hnfoBeesFnbNQupjFpE8MSS2LpJ3zGeqEkmfPYqwXV1: "JitoSOL",
  DHEiD7eew9gnaRujuEM5PR9SbvKdhSoS91dRJm7rKYMS: "mSOL",
  Hck546Ds2XdnqLYfR2Mp7N4vbFtMecF3sgHVFZ2s9yYc: "bSOL",
};

const useDummyAPYs = true;
const dummyAPY = {
  USDC: [0.0325, 0.0468],
  USDT: [0.0551, 0.0785],
  SOL: [0.0147, 0.0357],
  JitoSOL: [0.0006, 0.0063],
  mSOL: [0.0004, 0.0051],
  bSOL: [0.0017, 0.008],
};

type ReserveData = {
  address: PublicKey;
  symbol: string;
  available: string;
  marketPrice: string;
  depositTvl: string;
  borrowedTvl: string;
  supplyAPR: number;
  borrowAPR: number;
  mint: PublicKey;
};

export const klendMarket = async (req, res) => {
  const market = await KaminoMarket.load(
    connection,
    new PublicKey(KLEND_MARKET),
    KLEND_PROGRAM_ID
  );

  await market.loadReserves();

  const reserves: ReserveData[] = [];
  market.reserves.forEach((res, address) => {
    // ignore irrelevant reserves
    if (!ASSETS.includes(res.getTokenSymbol())) {
      return;
    }

    const dec = res.state.liquidity.mintDecimals.toNumber();
    const mult = 10 ** dec;

    const reserveData: ReserveData = {
      address: res.address,
      symbol: res.getTokenSymbol(),
      available: res.getLiquidityAvailableAmount().div(mult).toString(),
      marketPrice: res.getOracleMarketPrice().toString(),
      depositTvl: res.getDepositTvl().toString(),
      borrowedTvl: res.getBorrowTvl().toString(),
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

  const stakeRates = await stakingRates(null, null);

  let total = 0;
  let borrows = 0;
  let weightedAPY = 0;
  obl.getDeposits().forEach((b) => {
    let [supply, _] = dummyAPY[MINTS[b.mintAddress.toBase58()]];

    const staking = parseFloat(
      stakeRates[MINTS[b.mintAddress.toBase58()]] ?? "0"
    );
    supply += staking;

    weightedAPY += b.marketValueRefreshed.toNumber() * supply;
    total += b.marketValueRefreshed.toNumber();
  });
  obl.getBorrows().forEach((b) => {
    const [_, borrow] = dummyAPY[MINTS[b.mintAddress.toBase58()]];
    weightedAPY -= b.marketValueRefreshed.toNumber() * borrow;
    total += b.marketValueRefreshed.toNumber();
    borrows += b.marketValueRefreshed.toNumber();
  });

  const nav = total - borrows * 2;

  return {
    obligation: {
      borrows: obl
        .getBorrows()
        .filter((b) => b.marketValueRefreshed.gt(new Decimal(0.01))),
      deposits: obl
        .getDeposits()
        .filter((d) => d.marketValueRefreshed.gt(new Decimal(0.01))),
      ltv: obl.loanToValue(),
      pda: bestlendUserAccount.toBase58(),
      effectiveAPY: (weightedAPY / total).toString(),
      nav: nav.toString(),
      borrowLeft: (nav * (0.7 - obl.loanToValue().toNumber())).toString(),
    },
  };
};
