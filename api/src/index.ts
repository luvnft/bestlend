import dotenv from "dotenv";
dotenv.config();

import { klendMarket, klendObligation } from "./klend";
import { borrow, deposit, repay, withdraw } from "./tx";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { bestlendStats, checkForUpdate, stakingRates } from "./bestlend";
import { marginfiMarket } from "./marginfi";
import { tokenMetadata } from "./metadata";

const fastify = Fastify({
  logger: true,
  requestTimeout: 10_000,
});

fastify.register(cors);

const PORT = parseInt(process.env.PORT) || 3000;

fastify.get("/heartbeat", (req, res) => {
  return { message: "heartbeat" };
});

fastify.get("/", (req, res) => {
  return { message: "app available" };
});

fastify.get("/klend/market", klendMarket);
fastify.get("/klend/obligation", klendObligation);

fastify.get("/marginfi/market", marginfiMarket);

fastify.get("/bestlend/stats", bestlendStats);
fastify.get("/bestlend/stakingRates", stakingRates);
fastify.get("/bestlend/updateCheck", checkForUpdate);

fastify.post("/txs/deposit", deposit);
fastify.post("/txs/borrow", borrow);
fastify.post("/txs/repay", repay);
fastify.post("/txs/withdraw", withdraw);

fastify.get("/token_metadata/:ticker", tokenMetadata);

fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
