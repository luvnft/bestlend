import {
  Box,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Heading,
  IconButton,
  Text,
  Spacer,
  useDisclosure,
  VStack,
  chakra,
  Flex,
  Link,
  Stack,
  Button,
} from "@chakra-ui/react";
import { Audiowide } from "next/font/google";
import Wallet from "./wallet";
import { BellIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/utils/db";

const font = Audiowide({ weight: "400", subsets: ["latin"] });

const NavBar = () => {
  const { publicKey } = useWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const actions = useLiveQuery(
    () =>
      db.publishedActions
        .where("address")
        .equals(publicKey?.toBase58() ?? "-")
        .reverse()
        .sortBy("ts"),
    [publicKey]
  );

  let text = "BESTLEND";
  if (typeof window !== "undefined") {
    text = window?.innerWidth > 500 ? "BESTLEND" : "BLEND";
  }

  return (
    <>
      <HStack>
        <Flex>
          <chakra.span
            fontSize="3xl"
            fontWeight="bold"
            className={font.className}
          >
            {text}
          </chakra.span>
          <chakra.span color="owalaOrange" fontSize="lg" ml="2px" mt="14px">
            &#9679;
          </chakra.span>
        </Flex>
        <Spacer />
        <Wallet />
        <IconButton
          fontSize="2xl"
          aria-label="notifications"
          icon={<BellIcon />}
          variant="ghost"
          onClick={onOpen}
        />
      </HStack>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Notifications</DrawerHeader>
          <DrawerBody>
            <VStack>
              {actions?.map((m, i) => (
                <Card key={i} w="100%">
                  <CardBody>
                    <Stack spacing="0px">
                      <Heading size="xs" textTransform="uppercase">
                        {m.message}
                      </Heading>
                      <Text fontSize="sm">{m.details}</Text>
                      <Text fontSize="sm">{`amount: ${m.amount}`}</Text>
                      <Link
                        fontSize="sm"
                        isExternal
                        href={`https://solana.fm/tx/${m.signature}?cluster=devnet-alpha`}
                      >
                        <Button size="sm" variant="outline">
                          {m.signature?.slice(0, 8)}...
                          {m.signature?.slice(m.signature?.length - 8)}
                          <ExternalLinkIcon mx="4px" mb="2px" />
                        </Button>
                      </Link>
                      <Text fontSize="xs">{m.ts}</Text>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NavBar;
