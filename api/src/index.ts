import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import { klendMarket } from "./klend";

const REQUEST_TIMEOUT = 10000;

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
  res.setTimeout(REQUEST_TIMEOUT, function () {
    return res.status(500).json({ message: "request timeout" });
  });
  next();
});

app.get("/heartbeat", (req: Request, res: Response) => {
  res.json({ message: "heartbeat" });
});

app.get("/klend/market", klendMarket);

app.listen(port, () => {
  console.log({ env: process.env });
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
