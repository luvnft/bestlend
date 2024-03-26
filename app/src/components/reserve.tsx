import { KlendReserve, getDepositTx, getObligation } from "@/requests/backend";
import { getMarketIcon } from "@/utils/consts";
import { Asset, AssetGroup, LendingMarket } from "@/utils/models";
import {
  Box,
  Button,
  Center,
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
import { useMutation, useQuery } from "react-query";

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
  depositGroup: AssetGroup;
}

const Reserve = ({ asset, lendingMarket, reserve, depositGroup }: Props) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [amount, setAmount] = useState(0);

  const { tokenBalances } = useGetTokenBalances();
  const balance = tokenBalances?.find(
    (bal) => bal.mint.toBase58() === reserve?.mint
  );

  const obligation = useQuery(
    "getObligation",
    () => getObligation(publicKey!),
    { enabled: !!publicKey }
  );

  const position =
    depositGroup === asset.asset_group
      ? obligation.data?.deposits?.find((d) => d.mint.equals(asset.mint))
      : obligation.data?.borrows?.find((d) => d.mint.equals(asset.mint));

  const btnText = depositGroup === asset.asset_group ? "Deposit" : "Borrow";

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
          <Stack spacing={0}>
            <Box>{fmt.format(position?.amount ?? 0)}</Box>
            <Box fontSize="xs">${fmt.format(position?.marketValue ?? 0)}</Box>
          </Stack>
        </Td>
        <Td isNumeric>
          {!publicKey ? (
            <Wallet small />
          ) : (
            <Button size="sm" onClick={onOpen}>
              {btnText}
            </Button>
          )}
        </Td>
      </Tr>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {btnText} {reserve?.symbol}
          </ModalHeader>
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
              {btnText}
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
  value?: string | number;
  price?: string | number;
}) => {
  if (!value || !price) {
    return <Box>-</Box>;
  }

  const numValue = typeof value === "number" ? value : parseFloat(value);
  const numPrice = typeof price === "number" ? price : parseFloat(price);

  return (
    <Stack spacing={0}>
      <Box>{fmt.format(numValue)}</Box>
      <Box fontSize="xs">${fmt.format(numPrice * numValue)}</Box>
    </Stack>
  );
};

export default Reserve;
