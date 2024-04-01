import { Box, HStack, Link, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";

const FAQs = () => {
  return (
    <Stack spacing="2rem">
      <Question
        title="What is Bestlend?"
        content="Bestlend is a lending protocol that wraps around other lending protocols such as Kamino, Marginfi, and Solend."
      />
      <Question title="Why would I use Bestlend?" content="." />
      <Question title="How does it work?" content="." />
      <Question title="Can the performer key take my assets?" content="." />
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
