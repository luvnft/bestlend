import { Connection, PublicKey } from "@solana/web3.js";
import { KaminoMarket } from "@hubbleprotocol/kamino-lending-sdk";
import { PROGRAM_ID as KLEND_PROGRAM_ID } from "../../../clients/klend/src";

const KAMINO_LENDING_MARKET = new PublicKey(
  "EECvYiBQ21Tco5NSVUMHpcfKbkAcAAALDFWpGTUXJEUn"
);

type ReserveData = {
  assetPriceUSD: number;
  borrowInterestAPY: number;
  supplyInterestAPY: number;
  loanToValuePct: number;
  mintAddress: PublicKey;
};

export const getKaminoData = async (
  connection: Connection,
  user: PublicKey | null
) => {
  if (!user) {
    throw new Error("invalid pubkey");
  }

  const market = await KaminoMarket.load(
    connection,
    KAMINO_LENDING_MARKET,
    KLEND_PROGRAM_ID
  );
  if (!market) {
    throw new Error("no market returned");
  }

  const reserveData: ReserveData[] = [];
  market.reserves.forEach((res) => {
    const {
      assetPriceUSD,
      borrowInterestAPY,
      supplyInterestAPY,
      loanToValuePct,
      mintAddress,
    } = res.stats;
    reserveData.push({
      assetPriceUSD: assetPriceUSD.toNumber(),
      borrowInterestAPY,
      supplyInterestAPY,
      loanToValuePct,
      mintAddress,
    });
  });

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    KLEND_PROGRAM_ID
  );

  const [obligationKey] = PublicKey.findProgramAddressSync(
    [
      Uint8Array.from([0]),
      Uint8Array.from([0]),
      bestlendUserAccount.toBuffer(),
      KAMINO_LENDING_MARKET.toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ],
    KLEND_PROGRAM_ID
  );

  const obligation = await market.getObligationByAddress(obligationKey);

  return {
    obligation,
    reserveData,
  };
};
