import { connection } from "./rpc";
import { BestLendUserAccount, PROGRAM_ID } from "../../clients/bestlend/src";
import * as beet from "@metaplex-foundation/beet";

const toNumber = (value: beet.bignum): number => {
  if (typeof value === "number") return value;
  return value.toNumber();
};

export const bestlendStats = async (req, res) => {
  const filters = [
    {
      dataSize: 288 + 8,
    },
  ];

  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters,
  });

  const bestlendActs = accounts.map(
    (act) => BestLendUserAccount.deserialize(act.account.data)[0]
  );

  return {
    count: bestlendActs.length,
    tvl: bestlendActs.reduce((acc, act) => {
      const { value, expo } = act.lastAccountValue;
      return acc + toNumber(value) * 10 ** (toNumber(expo) * -1);
    }, 0),
  };
};

export const stakingRates = async (req, res) => {
  return {
    JitoSOL: "0.0814",
    mSOL: "0.0805",
    bSOL: "0.0789",
  };
};
