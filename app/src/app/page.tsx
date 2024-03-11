import Reserve from "@/components/reserve";
import { LSTS, STABLES } from "@/utils/consts";
import { LendingMarket } from "@/utils/models";
import { Box, Stack, VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <main>
      <Stack p="1rem" spacing="1rem">
        <Box fontSize="xl">Stables</Box>
        {STABLES.map((s) => (
          <Reserve asset={s} lendingMarket={LendingMarket.KAMINO} />
        ))}
        <Box fontSize="xl">SOL and LSTs</Box>
        {LSTS.map((a) => (
          <Reserve asset={a} lendingMarket={LendingMarket.KAMINO} />
        ))}
      </Stack>
    </main>
  );
}
