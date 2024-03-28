"use client";

import NavBar from "@/components/navbar";
import Reserve from "@/components/reserve";
import Stats from "@/components/stats";
import useWebsocket from "@/hooks/useWebSocket";
import {
  ActionUpdate,
  getActionUpdate,
  getKlendReserves,
  getObligation,
} from "@/requests/backend";
import { getBestLendAccount } from "@/requests/bestlend";
import { LSTS, STABLES } from "@/utils/consts";
import { Asset, AssetGroup, LendingMarket } from "@/utils/models";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";

const groups: [string, Asset[]][] = [
  ["Stables", STABLES],
  ["SOL and LSTs", LSTS],
];

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [checkForUpdates, setCheckForUpdates] = useState(false);
  const toast = useToast();
  const [messages, setMessages] = useState<ActionUpdate[]>(
    JSON.parse(localStorage.getItem("bestlend-messages") ?? "[]")
      .reverse()
      .slice(0, 5)
      .reverse()
  );

  useEffect(() => {
    if (publicKey) {
      setTimeout(() => setCheckForUpdates(true), 10_000);
    }
  }, [publicKey]);

  const updateQuery = useQuery(
    "getActionUpdate",
    () => getActionUpdate(publicKey!),
    { enabled: !!publicKey && checkForUpdates, refetchInterval: 60_000 }
  );

  useEffect(() => {
    if (updateQuery.data?.updates) {
      toast({
        title: updateQuery.data?.message,
        description: updateQuery.data?.details,
        status: "success",
        duration: 10_000,
        isClosable: true,
      });
      setMessages((msgs) => [...msgs, updateQuery.data]);
    }
  }, [`${updateQuery.data?.details}${updateQuery.data?.message}`]);

  useEffect(() => {
    localStorage.setItem("bestlend-messages", JSON.stringify(messages));
  }, [messages]);

  const reservesQuery = useQuery("getKlendReserves", () => getKlendReserves());
  const reserves = reservesQuery.data ?? [];

  const bestlendAccount = useQuery(
    "bestlendAccount",
    () => getBestLendAccount(connection, publicKey),
    { enabled: !!publicKey }
  );

  const isLoading =
    (!bestlendAccount.isFetched && !!publicKey) || !reservesQuery.isFetched;

  // const depositGroup = !bestlendAccount.data?.collateralGroup
  //   ? AssetGroup.STABLE
  //   : AssetGroup.LST;

  const depositGroup = !bestlendAccount.data?.collateralGroup
    ? AssetGroup.LST
    : AssetGroup.STABLE;

  return (
    <Box>
      <NavBar messages={messages} />
      <Stack p="1rem" spacing="1rem">
        <Stats />
        {groups.map(([group, assets]) => (
          <Card key={group}>
            <CardBody>
              <CardHeader>
                <Heading size="md">{group}</Heading>
              </CardHeader>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th></Th>
                      <Th isNumeric>available</Th>
                      <Th isNumeric>supply</Th>
                      <Th isNumeric>borrow</Th>
                      <Th isNumeric>position</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assets.map((s) => (
                      <Reserve
                        key={s.mint.toBase58()}
                        asset={s}
                        lendingMarket={LendingMarket.KAMINO}
                        depositGroup={depositGroup}
                        reserve={reserves?.find(
                          (r) => r.mint === s.mint.toBase58()
                        )}
                      />
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
            {isLoading && (
              <Progress
                size="xs"
                isIndeterminate
                colorScheme="orange"
                bg="owalaBeige"
                mx="4px"
              />
            )}
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
