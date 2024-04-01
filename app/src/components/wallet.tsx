"use client";

import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { track } from "@vercel/analytics";

const WalletSelect = ({ small }: { small?: boolean }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { select, wallets, publicKey, disconnect, connect } = useWallet();
  const queryClient = useQueryClient();

  const [selectedWallet, setSelectWallet] = useState<Wallet | undefined>();
  const connectableWallets = wallets.filter(
    (wallet) => wallet.readyState === "Installed"
  );

  useEffect(() => {
    if (!isOpen && !publicKey) {
      setSelectWallet(undefined);
    }
  }, [isOpen, publicKey]);

  const modalContent = (
    <VStack gap={4}>
      {connectableWallets.length ? (
        connectableWallets.map((wallet) => (
          <Button
            key={wallet.adapter.name}
            onClick={() => {
              setSelectWallet(wallet);
              select(wallet.adapter.name);
            }}
            w="full"
            size="lg"
            fontSize="md"
            leftIcon={
              <Image
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                boxSize={6}
              />
            }
            variant="outline"
          >
            {wallet.adapter.name}
          </Button>
        ))
      ) : (
        <Stack>
          <Text>No wallet found</Text>
          <Text>Please download a supported Solana wallet</Text>
        </Stack>
      )}
      {selectedWallet && (
        <Button
          w="full"
          mt="1rem"
          variant="outline"
          onClick={() => {
            connect()
              .catch((e) => {
                console.error(e);
              })
              .finally(async () => {
                await queryClient.clear();
                track("connectWallet");
                onClose();
              });
          }}
        >
          Connect to {selectedWallet.adapter.name}
        </Button>
      )}
    </VStack>
  );

  const formatKey = (key: PublicKey) => {
    const s = key.toString();
    return `${s.slice(0, 5)}...${s.slice(s.length - 5)}`;
  };

  return (
    <>
      {!publicKey ? (
        <Button
          onClick={!!selectedWallet ? connect : onOpen}
          w="140px"
          size={small ? "sm" : "md"}
        >
          Connect Wallet
        </Button>
      ) : (
        <Tooltip label={formatKey(publicKey)}>
          <Button
            onClick={async () => {
              setSelectWallet(undefined);
              await disconnect();
              await queryClient.clear();
            }}
            leftIcon={
              <Image
                src={selectedWallet?.adapter.icon}
                alt={selectedWallet?.adapter.name}
                h={6}
                w={6}
              />
            }
          >
            Disconnect Wallet
          </Button>
        </Tooltip>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Wallet to Connect</ModalHeader>
          <ModalCloseButton />
          <ModalBody my="2rem">{modalContent}</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WalletSelect;
