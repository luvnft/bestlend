"use client";

import InitAccount from "@/components/initAccount";
import NavBar from "@/components/navbar";
import Reserve from "@/components/reserve";
import { LSTS, STABLES } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  StackDivider,
} from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const groups: [string, Asset[]][] = [
  ["Stables", STABLES],
  ["SOL and LSTs", LSTS],
];

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  return (
    <Box>
      <NavBar />
      <Stack p="1rem" spacing="1rem">
        <InitAccount />
        {groups.map(([group, assets]) => (
          <Card key={group}>
            <CardBody>
              <CardHeader>
                <Heading size="md">{group}</Heading>
              </CardHeader>
              <Stack
                spacing="1rem"
                divider={
                  <StackDivider borderColor="owalaOrange" borderWidth="2px" />
                }
              >
                {assets.map((s) => (
                  <Reserve
                    key={s.mint.toBase58()}
                    asset={s}
                    lendingMarket={LendingMarket.KAMINO}
                  />
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
