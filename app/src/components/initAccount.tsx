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
  Spacer,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Wallet from "./wallet";
import { useEffect, useState } from "react";
import { ASSETS, LSTS, STABLES } from "@/utils/consts";
import { Asset, AssetGroup } from "@/utils/models";

const InitAccount = () => {
  const { publicKey } = useWallet();
  const { tokenBalances, isLoading } = useGetTokenBalances();

  // selected tokens with defaults
  const [selectedDepositToken, setSelectedDepositToken] = useState(
    ASSETS["SOL"]
  );
  const [selectedBorrowToken, setSelectedBorrowToken] = useState(
    ASSETS["USDC"]
  );

  // deposit and borrow amounts
  const [depositAmount, setDepositAmount] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);

  const depositBalance = tokenBalances?.find(
    (b) => b.internal.ticker === selectedDepositToken.ticker
  )?.balance;

  const createDisabled =
    isLoading ||
    !publicKey ||
    depositAmount > (depositBalance ?? 0) ||
    !depositAmount ||
    borrowAmount > depositAmount;

  return (
    <Center>
      <Card w="50%" my="4rem">
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
            <AssetInput
              headerText="You're depositing"
              isConnected={!!publicKey}
              isLoading={isLoading}
              selectableAssets={tokenBalances?.map((b) => b.internal) ?? []}
              selectedAsset={selectedDepositToken}
              setSelectedToken={setSelectedDepositToken}
              setInputAmount={setDepositAmount}
              walletBalance={depositBalance}
            />
            <AssetInput
              headerText="and borrowing"
              isConnected={!!publicKey}
              isLoading={isLoading}
              selectableAssets={
                selectedDepositToken.asset_group === AssetGroup.STABLE
                  ? LSTS
                  : STABLES
              }
              selectedAsset={selectedBorrowToken}
              setSelectedToken={setSelectedBorrowToken}
              setInputAmount={setBorrowAmount}
            />
            <Button isDisabled={createDisabled}>Create Account</Button>
          </Stack>
        </CardBody>
      </Card>
    </Center>
  );
};

const AssetInput = ({
  headerText,
  isConnected,
  isLoading,
  selectableAssets,
  selectedAsset,
  setSelectedToken,
  setInputAmount,
  walletBalance,
}: {
  headerText: string;
  isConnected: boolean;
  isLoading: boolean;
  selectableAssets: Asset[];
  selectedAsset?: Asset;
  setSelectedToken: (a: Asset) => void;
  setInputAmount: (n: number) => void;
  walletBalance?: number;
}) => {
  return (
    <Box>
      <HStack>
        <Box>{headerText}</Box>
        <Spacer />
        {walletBalance && <Box fontSize="sm">Balance: {walletBalance}</Box>}
      </HStack>
      <HStack>
        <NumberInput
          min={0}
          variant="filled"
          w="100%"
          onChange={(_, n) => setInputAmount(n)}
        >
          <NumberInputField />
        </NumberInput>
        {!isConnected ? (
          <Wallet />
        ) : (
          <Menu>
            <MenuButton as={Button} w="100px" isLoading={isLoading}>
              <HStack spacing={1}>
                <Image
                  src={selectedAsset?.iconURL}
                  alt="token icon"
                  boxSize={5}
                  borderRadius="full"
                />
                <Box>{selectedAsset?.ticker}</Box>
              </HStack>
            </MenuButton>
            <MenuList>
              {selectableAssets.map((t) => (
                <MenuItem key={t.ticker} onClick={() => setSelectedToken(t)}>
                  <HStack>
                    <Image
                      src={t.iconURL}
                      alt="token icon"
                      boxSize={5}
                      borderRadius="full"
                    />
                    <Box>{t.ticker}</Box>
                  </HStack>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
      </HStack>
    </Box>
  );
};

export default InitAccount;
