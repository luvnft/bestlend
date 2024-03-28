import { connection } from "./rpc";
import { BestLendUserAccount, PROGRAM_ID } from "../../clients/bestlend/src";
import * as beet from "@metaplex-foundation/beet";
import { PublicKey } from "@solana/web3.js";
import chalk from "chalk";
import { KLEND_MARKET, klendMarket } from "./klend";
import { PROGRAM_ID as KLEND_PROGRAM_ID } from "../../clients/klend/src";
import { KaminoMarket } from "@hubbleprotocol/kamino-lending-sdk";

const toNumber = (value: beet.bignum): number => {
  if (typeof value === "number") return value;
  return value.toNumber();
};

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const subscribe = async (socket, request) => {
  const sendheartbeat = () => {
    setTimeout(() => {
      socket.send('{"type":"heartbeat"}');
      sendheartbeat();
    }, 2500);
  };

  const monitorAddress = async (user: PublicKey) => {
    console.log(chalk.yellow(`monitoring ${user.toBase58()}`));

    const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("bestlend_user_account"), user.toBuffer()],
      PROGRAM_ID
    );

    const market = await KaminoMarket.load(
      connection,
      new PublicKey(KLEND_MARKET),
      KLEND_PROGRAM_ID
    );

    let poll = true;
    while (poll) {
      await sleep(10_000);

      // get latest APYs for reserves
      const data = await klendMarket(null, null);
      if (!data) continue;
      const { reserves } = data;

      // get latest staking rates
      const rates = await stakingRates(null, null);
      const getRate = (ticker: string): number => {
        const r = rates[ticker];
        if (!r) return 0;
        return parseFloat(r);
      };

      const obligations = await market.getAllUserObligations(
        bestlendUserAccount
      );

      const obl = obligations?.[0];
      if (!obl) continue;

      for (const deposit of obl.getDeposits()) {
        const currentReserve = reserves.find((res) =>
          res.mint.equals(deposit.mintAddress)
        );

        // find best rate that includes staking
        const best = reserves.sort(
          (a, b) =>
            b.supplyAPR + getRate(b.symbol) - (a.supplyAPR + getRate(a.symbol))
        )[0];

        const current =
          currentReserve.supplyAPR + getRate(currentReserve.symbol);
        const potential = best.supplyAPR + getRate(best.symbol);

        // move user to better asset
        if (potential > current) {
          console.log(
            chalk.greenBright(`getting ${current} but could get ${potential}`)
          );

          socket.send(
            JSON.stringify({
              message: `Moving your collateral from ${currentReserve.symbol} to ${best.symbol}`,
              details: `yield: ${Math.round(current * 10000) / 100}% -> ${
                Math.round(potential * 10000) / 100
              }% (bestlend will move the funds on your behalf)`,
              type: "action",
            })
          );

          await sleep(120_000);
        }
      }
    }
  };

  sendheartbeat();
  socket.on("message", (message) => {
    try {
      const msg = JSON.parse(message.toString());
      console.log(chalk.yellow(`socket message: ${message.toString()}`));

      if (msg.publicKey) {
        monitorAddress(new PublicKey(msg.publicKey));
      }
    } catch (e) {
      console.log(`socket message err: `, message.toString(), e);
    }
  });
};

export const stakingRates = async (req, res) => {
  return {
    JitoSOL: "0.0814",
    mSOL: "0.0805",
    bSOL: "0.0789",
  };
};
