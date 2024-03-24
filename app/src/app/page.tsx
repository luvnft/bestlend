"use client";

import InitAccount from "@/components/initAccount";
import NavBar from "@/components/navbar";
import Reserve from "@/components/reserve";
import { getKlendReserves } from "@/requests/backend";
import { LSTS, STABLES } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useQuery } from "react-query";

const groups: [string, Asset[]][] = [
  ["Stables", STABLES],
  ["SOL and LSTs", LSTS],
];

export default function Home() {
  const reservesQuery = useQuery("getKlendReserves", () => getKlendReserves());
  const reserves = reservesQuery.data ?? [];

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
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th></Th>
                      <Th isNumeric>available</Th>
                      <Th isNumeric>supply</Th>
                      <Th isNumeric>borrow</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {assets.map((s) => (
                      <Reserve
                        key={s.mint.toBase58()}
                        asset={s}
                        lendingMarket={LendingMarket.KAMINO}
                        reserve={reserves?.find(
                          (r) => r.mint === s.mint.toBase58()
                        )}
                      />
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
