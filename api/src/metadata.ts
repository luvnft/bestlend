export const tokenMetadata = async (req, res) => {
  const { ticker } = req.params;

  const images = {
    USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png",
    USDT: "https://assets.coingecko.com/coins/images/325/standard/Tether.png",
    JitoSOL: "https://s2.coinmarketcap.com/static/img/coins/64x64/22533.png",
    mSOL: "https://assets.coingecko.com/coins/images/17752/standard/mSOL.png",
    bSOL: "https://assets.coingecko.com/coins/images/26636/standard/blazesolana.png",
  };

  return {
    name: ticker,
    symbol: ticker,
    description: `${ticker} devnet`,
    image: images[ticker],
  };
};
