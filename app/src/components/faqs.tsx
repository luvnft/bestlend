import { Box, HStack, Link, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

const FAQs = () => {
  return (
    <Stack spacing="2rem">
      <Question
        title="What is Bestlend?"
        content="Bestlend maximizes your lending and borrow rates to save you time and money. It will find the best rates from different lending apps on Solana automatically and move your funds for you. Bestlend will also swap between correlated assets so you can deposit any stablecoin or LST and know you're getting the best yeild."
      />
      <Question
        title="How is Bestlend different from Flexlend?"
        content="Bestlend will move your collateral around to get you the best rates like Flexlend but will also swap your collateral if higher rates are available. For example, a USDC deposit on Kamino could be swapped and moved to USDT on Marinfi. Bestlend also moves your debt around so you don't have to worry about rates changing or updating your position."
      />
      <Question
        title="How does it work?"
        content="Debt obligations for each protocol are held by a PDA with strict permissions. A user can perform any action against their position but the Bestlend performer can only do specific actions against whitelisted programs. The value of the position must be established before any action and must be checked after every action to ensure the action results in a position of the same value."
      />
      <Question
        title="Can the performer key take my assets?"
        content="The performer is only able to move assets around and transaction will fail if they result in a position of less value based on oracle rates. Future versions of the protocol will include configurations for setting max price impact, blacklisting assets and protocols, the frequency of actions, and the threshold for actions."
      />
      <Question
        title="Why did my SOL position get moved to an LST with a lower yield?"
        content="Bestlend also considers staking yield when determining the optimal yield. For example, JitoSOL might have a lower suppy APY but still offer more yield than SOL when considering its staking rate. Conversely, it might be more advantagous to convert LSTs to SOL if SOL supply rates are elevated."
      />
      <Question
        title="Why did only part of my position get moved?"
        content="Bestlend might decide to move the position over a period of time depending on the size of the position and the LTV of the position."
      />
      <Question
        title="Where can I get devnet SOL?"
        content={
          <Link href="https://faucet.solana.com/" isExternal>
            faucet.solana.com
          </Link>
        }
      />
      <Question
        title="Where can I provide feedback?"
        content={
          <Box>
            {"Use the telegram link at the bottom of the page or message "}
            <Link isExternal href="https://twitter.com/_bestlend_">
              Bestlend
            </Link>
            {" or "}
            <Link isExternal href="https://twitter.com/coin_curdis">
              Kurtis
            </Link>
            {" on Twitter"}
          </Box>
        }
      />
    </Stack>
  );
};

const Question = ({
  title,
  content,
}: {
  title: string;
  content: ReactNode;
}) => {
  return (
    <Stack>
      <Box fontSize="xl" textDecoration="underline">
        {title}
      </Box>
      <Box>{content}</Box>
    </Stack>
  );
};

export default FAQs;
