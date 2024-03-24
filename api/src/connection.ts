import { ShyftSdk, Network } from "@shyft-to/js";

export const shyft = new ShyftSdk({
  apiKey: process.env.SHYFT_KEY ?? "",
  network: Network.Devnet,
});
