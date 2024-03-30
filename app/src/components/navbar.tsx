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
} from "@chakra-ui/react";
import { Audiowide } from "next/font/google";
import Wallet from "./wallet";
import { BellIcon } from "@chakra-ui/icons";
import { ActionUpdate } from "@/requests/backend";
import { useWallet } from "@solana/wallet-adapter-react";

const font = Audiowide({ weight: "400", subsets: ["latin"] });

const NavBar = ({ messages }: { messages: ActionUpdate[] }) => {
  const { publicKey } = useWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();

  let text = "BESTLEND";
  if (typeof window !== "undefined") {
    text = window?.innerWidth > 500 ? "BESTLEND" : "BLEND";
  }

  return (
    <>
      <HStack px="1rem" pt="0.5rem">
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
              {messages
                .filter((m) => m.address === publicKey?.toBase58())
                .map((m, i) => (
                  <Card key={i}>
                    <CardBody>
                      <Box>
                        <Heading size="xs" textTransform="uppercase">
                          {m.message}
                        </Heading>
                        <Text pt="2" fontSize="sm">
                          {m.details}
                        </Text>
                        <Text pt="2" fontSize="xs">
                          {m.ts}
                        </Text>
                      </Box>
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
