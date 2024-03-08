import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { reserveConfigBeet } from "../clients/klend/src";

export const getReserveConfig = (oracle: PublicKey, ticker: string, currentPrice: number, priceExpo: number) => {
  const mintTicker = Array(32).fill(0);
  Buffer.from(ticker).forEach((b, i) => (mintTicker[i] = b));

  // mostly copied from klend usdc reserve
  const reserveConfig = {
    status: 0,
    assetTier: 0,
    reserved0: Array(2),
    multiplierSideBoost: Array(2),
    multiplierTagBoost: Array(8),
    protocolTakeRatePct: 10,
    protocolLiquidationFeePct: 50,
    loanToValuePct: 80,
    liquidationThresholdPct: 90,
    minLiquidationBonusBps: 200,
    maxLiquidationBonusBps: 1000,
    badDebtLiquidationBonusBps: 99,
    deleveragingMarginCallPeriodSecs: 604800,
    deleveragingThresholdSlotsPerBps: 7200,
    fees: {
      borrowFeeSf: 0,
      flashLoanFeeSf: 0,
      padding: Array(8)
    },
    borrowRateCurve: {
      points: [
        {
          "utilizationRateBps": 0,
          "borrowRateBps": 1
        },
        {
          "utilizationRateBps": 8000,
          "borrowRateBps": 300
        },
        {
          "utilizationRateBps": 8500,
          "borrowRateBps": 670
        },
        {
          "utilizationRateBps": 9000,
          "borrowRateBps": 1500
        },
        {
          "utilizationRateBps": 9500,
          "borrowRateBps": 3354
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        },
        {
          "utilizationRateBps": 10000,
          "borrowRateBps": 7500
        }
      ]
    },
    borrowFactorPct: 100,
    depositLimit: 30000000000000,
    borrowLimit: 30000000000000,
    tokenInfo: {
      "name": mintTicker,
      "heuristic": {
        "lower": Math.floor(currentPrice / 2),
        "upper": currentPrice * 2,
        "exp": priceExpo
      },
      maxTwapDivergenceBps: 1000,
      maxAgePriceSeconds: new BN("99999999999"),
      maxAgeTwapSeconds: new BN("99999999999"),
      scopeConfiguration: {
        priceFeed: PublicKey.default,
        priceChain: Array(4),
        twapChain: Array(4)
      },
      switchboardConfiguration: {
        priceAggregator: PublicKey.default,
        twapAggregator: PublicKey.default,
      },
      pythConfiguration: {
        price: oracle,
      },
      padding: Array(20)
    },
    depositWithdrawalCap: {
      configCapacity: 5000000000000,
      currentTotal: 0,
      lastIntervalStartTimestamp: 0,
      configIntervalLengthSeconds: 86400
    },
    debtWithdrawalCap: {
      configCapacity: 5000000000000,
      currentTotal: 0,
      lastIntervalStartTimestamp: 0,
      configIntervalLengthSeconds: 86400
    },
    elevationGroups: Array(20),
    reserved1: Array(4)
  }

  const configBytes: number[] = Array(648).fill(0);

  const [configSerial] = reserveConfigBeet.serialize(reserveConfig);
  configSerial.forEach((b, i) => (configBytes[i] = b));

  return configBytes
}
