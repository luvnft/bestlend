"use client";

import { TokenBalance, useGetTokenBalances } from "@/requests/shyft";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  HStack,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  NumberInput,
  NumberInputField,
  Stack,
  StackDivider,
  Text,
  Image,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Wallet from "./wallet";
import { useEffect, useState } from "react";

const InitAccount = () => {
  const { publicKey } = useWallet();
  const { tokenBalances, isLoading } = useGetTokenBalances();
  const [selectedToken, setSelectedToken] = useState<
    undefined | TokenBalance
  >();

  useEffect(() => {
    const SOL = tokenBalances?.find((b) => b.isNative);
    if (SOL && !selectedToken) setSelectedToken(SOL);
  }, [tokenBalances]);

  return (
    <Center>
      <Card w="50%">
        <CardHeader>
          <Heading size="md">Create Account</Heading>
        </CardHeader>
        <CardBody>
          <Stack
            divider={
              <StackDivider borderColor="owalaOrange" borderWidth="2px" />
            }
            spacing="4"
          >
            <Box>
              <Text>You're depositing</Text>
              <HStack>
                <NumberInput min={0} variant="filled" w="100%">
                  <NumberInputField />
                </NumberInput>
                {!publicKey ? (
                  <Wallet />
                ) : (
                  <Menu>
                    <MenuButton as={Button} w="100px" isLoading={isLoading}>
                      <HStack>
                        <Image
                          src={selectedToken?.internal.iconURL}
                          alt="token icon"
                          boxSize={5}
                          borderRadius="full"
                        />
                        <Box>{selectedToken?.info.symbol}</Box>
                      </HStack>
                    </MenuButton>
                    <MenuList>
                      {tokenBalances.map((t) => (
                        <MenuItem key={t.info.symbol}>
                          <HStack>
                            <Image
                              src={t.internal.iconURL}
                              alt="token icon"
                              boxSize={5}
                              borderRadius="full"
                            />
                            <Box>{t.info.name}</Box>
                          </HStack>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                )}
              </HStack>
            </Box>
            <Box>
              <Heading size="xs" textTransform="uppercase">
                Overview
              </Heading>
              <Text pt="2" fontSize="sm">
                Check out the overview of your clients.
              </Text>
            </Box>
          </Stack>
        </CardBody>
      </Card>
    </Center>
  );
};

export default InitAccount;
