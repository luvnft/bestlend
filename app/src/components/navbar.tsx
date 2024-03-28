import {
  Box,
  Button,
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
} from "@chakra-ui/react";
import { Audiowide } from "next/font/google";
import Wallet from "./wallet";
import { BellIcon } from "@chakra-ui/icons";
import { Message } from "@/hooks/useWebSocket";

const font = Audiowide({ weight: "400", subsets: ["latin"] });

const NavBar = ({ messages }: { messages: Message[] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <HStack px="1rem">
        <Box fontSize="3xl" fontWeight="bold" className={font.className}>
          BESTLEND
        </Box>
        <Box color="owalaOrange" fontSize="lg" ml="-7px" mt="8px">
          &#9679;
        </Box>
        <Spacer />
        <Wallet />
        <IconButton
          fontSize="2xl"
          aria-label="notifications"
          icon={<BellIcon />}
          variant="outline"
          onClick={onOpen}
        />
      </HStack>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Notifications</DrawerHeader>
          <DrawerBody>
            {messages.map((m) => (
              <Card>
                <CardBody>
                  <Box>
                    <Heading size="xs" textTransform="uppercase">
                      {m.message}
                    </Heading>
                    <Text pt="2" fontSize="sm">
                      {m.details}
                    </Text>
                    <Text pt="2" fontSize="xs">
                      {m.ts.toJSON()}
                    </Text>
                  </Box>
                </CardBody>
              </Card>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NavBar;
