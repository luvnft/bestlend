import dotenv from "dotenv";
dotenv.config();

import { klendMarket } from "./klend";
import { createAccount } from "./tx";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { bestlendStats } from "./bestlend";

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

fastify.get("/bestlend/stats", bestlendStats);

fastify.post("/txs/init", createAccount);

fastify.listen({ port: PORT }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});