import { KlendReserve, getDepositTx } from "@/requests/backend";
import { getMarketIcon } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Spacer,
  Stack,
  Td,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Wallet from "./wallet";
import { useGetTokenBalances } from "@/requests/rpc";
import { useState } from "react";
import { useMutation } from "react-query";

let fmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
});

let fmtPct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface Props {
  asset: Asset;
  lendingMarket: LendingMarket;
  reserve?: KlendReserve;
}

const Reserve = ({ asset, lendingMarket, reserve }: Props) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { tokenBalances } = useGetTokenBalances();
  const balance = tokenBalances?.find(
    (bal) => bal.mint.toBase58() === reserve?.mint
  );

  const [amount, setAmount] = useState(0);

  const txMutation = useMutation({
    mutationFn: () =>
      getDepositTx(
        reserve!.address,
        publicKey!,
        amount * 10 ** asset.decimals,
        reserve!.symbol
      ),
    onSuccess: async (tx) => {
      sendTransaction(tx, connection)
        .then((signature) =>
          toast({
            title: "Tx success",
            description: signature,
            status: "success",
          })
        )
        .catch((e) =>
          toast({
            title: "Error sending tx",
            description: e.toString(),
            status: "error",
          })
        )
        .finally(onClose);
    },
    onError: (error) => {
      console.log(`error getting tx: ${error}`);
      toast({
        title: "error getting tx",
        status: "error",
      });
      onClose();
    },
  });

  return (
    <>
      <Tr>
        <Td>
          <HStack spacing="10px" minW="75px">
            <Flex>
              <Image
                src={asset.iconURL}
                boxSize="30px"
                borderRadius="full"
                alt="asset icon"
              />
              <Box ml="-12px" mt="17px">
                <Image
                  src={getMarketIcon(lendingMarket)}
                  boxSize="18px"
                  borderRadius="full"
                  alt="lending market icon"
                />
              </Box>
            </Flex>
            <Box>{asset.ticker}</Box>
          </HStack>
        </Td>
        <Td isNumeric>
          <ValueWithPrice
            value={reserve?.available}
            price={reserve?.marketPrice}
          />
        </Td>
        <Td isNumeric>
          <Box>{!reserve ? "-" : fmtPct.format(reserve?.supplyAPR)}</Box>
        </Td>
        <Td isNumeric>
          <Box>{!reserve ? "-" : fmtPct.format(reserve?.borrowAPR)}</Box>
        </Td>
        <Td isNumeric>
          {!publicKey ? (
            <Wallet small />
          ) : (
            <Button size="sm" onClick={onOpen}>
              Deposit
            </Button>
          )}
        </Td>
      </Tr>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deposit {reserve?.symbol}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <HStack>
                <Spacer />
                {balance && <Box fontSize="sm">Balance: {balance.balance}</Box>}
              </HStack>
              <NumberInput
                min={0}
                variant="filled"
                w="100%"
                onChange={(_, n) => setAmount(n)}
              >
                <NumberInputField />
              </NumberInput>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={!amount}
              onClick={() => txMutation.mutate()}
              isLoading={txMutation.isLoading}
            >
              Deposit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const ValueWithPrice = ({
  value,
  price,
}: {
  value?: string;
  price?: string;
}) => {
  if (!value || !price) {
    return <Box>-</Box>;
  }

  const numValue = parseFloat(value);
  const numPrice = parseFloat(price);

  return (
    <Stack spacing={0}>
      <Box>{fmt.format(numValue)}</Box>
      <Box fontSize="xs">${fmt.format(numPrice * numValue)}</Box>
    </Stack>
  );
};

export default Reserve;
