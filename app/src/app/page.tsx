"use client";

import FAQs from "@/components/faqs";
import Footer from "@/components/footer";
import NavBar from "@/components/navbar";
import Reserve from "@/components/reserve";
import Stats from "@/components/stats";
import {
  ActionUpdate,
  getActionUpdate,
  getKlendReserves,
  getMarginfiReserves,
} from "@/requests/backend";
import { getBestLendAccount } from "@/requests/bestlend";
import { ASSETS_MINTS, LSTS, STABLES } from "@/utils/consts";
import { db } from "@/utils/db";
import { Asset, AssetGroup, LendingMarket } from "@/utils/models";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  Progress,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { setUser } from "@sentry/nextjs";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";

const groups: [string, Asset[]][] = [
  ["Stables", STABLES],
  ["SOL and LSTs", LSTS],
];

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [checkForUpdates, setCheckForUpdates] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  // FAQs drawer
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (publicKey) {
      setTimeout(() => setCheckForUpdates(true), 30_000);
      setUser({ id: publicKey.toBase58(), username: publicKey.toBase58() });
    }
  }, [publicKey]);

  const updateQuery = useQuery(
    "getActionUpdate",
    () => getActionUpdate(publicKey!),
    {
      enabled: !!publicKey && checkForUpdates,
      refetchInterval: 30_000,
      retry: 0,
    }
  );

  useEffect(() => {
    const data = updateQuery.data;
    if (data?.signature) {
      toast({
        title: data.message,
        description: `${data.details} (Amount: ${data.amount})`,
        status: "success",
        duration: 10_000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["getObligation"] });
      db.publishedActions
        .add({
          message: data.message,
          details: data.details,
          ts: new Date().toJSON(),
          signature: data.signature,
          address: publicKey!.toBase58(),
          amount: data.amount,
        })
        .catch((e) => console.error(`error adding db entry: ${e}`));
    }
  }, [updateQuery.data?.signature]);

  const reservesQuery = useQuery("getKlendReserves", () => getKlendReserves());
  const mfiReservesQuery = useQuery("getMarginfiReserves", () =>
    getMarginfiReserves()
  );
  const reserves = reservesQuery.data ?? [];

  const bestlendAccount = useQuery(
    "bestlendAccount",
    () => getBestLendAccount(connection, publicKey),
    { enabled: !!publicKey }
  );

  const isLoading =
    (!bestlendAccount.isFetched && !!publicKey) || !reservesQuery.isFetched;

  const depositGroup = !bestlendAccount.data?.collateralGroup
    ? AssetGroup.STABLE
    : AssetGroup.LST;

  const findMarginfiMint = (mint: PublicKey) => {
    return mfiReservesQuery.data?.find((res) => res.mint === mint.toBase58());
  };

  return (
    <Stack p="1rem" spacing="1rem" minH="100vh">
      <NavBar />
      <Stats faqsOpen={onOpen} />
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
                    <>
                      <Reserve
                        key={s.mint.toBase58()}
                        asset={s}
                        lendingMarket={LendingMarket.KAMINO}
                        depositGroup={depositGroup}
                        reserve={reserves?.find(
                          (r) => r.mint === s.mint.toBase58()
                        )}
                      />
                      {findMarginfiMint(s.mint) && (
                        <Reserve
                          key={`mfi-${s.mint.toBase58()}`}
                          asset={ASSETS_MINTS[s.mint.toBase58()]}
                          lendingMarket={LendingMarket.MARGINFI}
                          depositGroup={depositGroup}
                          reserve={findMarginfiMint(s.mint)}
                        />
                      )}
                    </>
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
      <Spacer />
      <Footer faqsOpen={onOpen} />
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>FAQs</DrawerHeader>
          <DrawerBody>
            <FAQs />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Stack>
  );
}
