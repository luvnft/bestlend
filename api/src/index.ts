import dotenv from "dotenv";
dotenv.config();

import { klendMarket, klendObligation } from "./klend";
import { deposit } from "./tx";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { bestlendStats, stakingRates, subscribe } from "./bestlend";
import ws from "@fastify/websocket";

const fastify = Fastify({
  logger: true,
  requestTimeout: 10_000,
});

fastify.register(cors);
fastify.register(require("@fastify/websocket"));

const PORT = parseInt(process.env.PORT) || 3000;

fastify.get("/heartbeat", (req, res) => {
  return { message: "heartbeat" };
});

fastify.get("/", (req, res) => {
  return { message: "app available" };
});

fastify.get("/klend/market", klendMarket);
fastify.get("/klend/obligation", klendObligation);

fastify.get("/bestlend/stats", bestlendStats);
fastify.get("/bestlend/stakingRates", stakingRates);

fastify.register(async function (fastify) {
  fastify.get("/subscribe", { websocket: true }, subscribe);
});

fastify.post("/txs/deposit", deposit);

fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
