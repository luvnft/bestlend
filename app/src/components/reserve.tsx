import {
  KlendReserve,
  getBorrowTx,
  getDepositTx,
  getObligation,
  getRepayTx,
  getStakingRates,
  getWithdrawTx,
} from "@/requests/backend";
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
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { SunIcon } from "@chakra-ui/icons";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Wallet from "./wallet";
import { useGetTokenBalances } from "@/requests/rpc";
import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { fmtCompact, fmtPct } from "@/utils/fmt";
import { getBestLendAccount } from "@/requests/bestlend";

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
  const [isDepositBorrowAction, setIsDepositBorrowAction] = useState(true);

  const ratesQuery = useQuery("stakingRates", () => getStakingRates());
  const rate = ratesQuery.data?.[asset.ticker];

  const { tokenBalances } = useGetTokenBalances();
  const balance = tokenBalances?.find(
    (bal) => bal.mint.toBase58() === reserve?.mint
  );

  const bestlendAccount = useQuery(
    "bestlendAccount",
    () => getBestLendAccount(connection, publicKey),
    { enabled: !!publicKey }
  );

  const obligation = useQuery(
    "getObligation",
    () => getObligation(publicKey!),
    { enabled: !!publicKey }
  );

  const position =
    depositGroup === asset.asset_group
      ? obligation.data?.deposits?.find(
          (d) =>
            d.mint.equals(asset.mint) && lendingMarket === LendingMarket.KAMINO
        )
      : obligation.data?.borrows?.find(
          (d) =>
            d.mint.equals(asset.mint) && lendingMarket === LendingMarket.KAMINO
        );

  const isDeposit = depositGroup === asset.asset_group;
  let btnText = isDeposit ? "Deposit" : "Borrow";
  let otherBtnText = isDeposit ? "Withdraw" : "Repay";

  // first deposit, they can do either
  if (!bestlendAccount.isSuccess) btnText = "Deposit";

  const getAction = () => {
    if (isDeposit) return isDepositBorrowAction ? getDepositTx : getWithdrawTx;
    return isDepositBorrowAction ? getBorrowTx : getRepayTx;
  };

  const txMutation = useMutation({
    mutationFn: () =>
      getAction()(
        reserve!.address,
        publicKey!,
        amount * 10 ** asset.decimals,
        reserve!.symbol
      ),
    onSuccess: async (txs) => {
      for (const tx of txs) {
        try {
          const sig = await sendTransaction(tx, connection);
          toast({
            title: "Tx success",
            description: sig,
            status: "success",
          });
        } catch (e) {
          toast({
            title: "Error sending tx",
            description: (e as any)?.toString?.(),
            status: "error",
          });
        }
      }
      onClose();
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
          <HStack spacing="10px" minW="125px">
            <Flex>
              <Image
                src={asset.iconURL}
                boxSize="30px"
                borderRadius="full"
                alt="asset icon"
              />
              <Tooltip label={lendingMarket}>
                <Box ml="-12px" mt="17px">
                  <Image
                    src={getMarketIcon(lendingMarket)}
                    boxSize="18px"
                    borderRadius="full"
                    alt="lending market icon"
                  />
                </Box>
              </Tooltip>
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
          {!reserve ? (
            "-"
          ) : (
            <Flex float="right">
              <Box>{fmtPct.format(reserve?.supplyAPR)}</Box>
              {rate && (
                <Tooltip
                  label={`+ ${fmtPct.format(parseFloat(rate))} staking reward`}
                  placement="top"
                >
                  <SunIcon fontSize="sm" color="owalaOrange" />
                </Tooltip>
              )}
            </Flex>
          )}
        </Td>
        <Td isNumeric>
          <Box>{!reserve ? "-" : fmtPct.format(reserve?.borrowAPR)}</Box>
        </Td>
        <Td isNumeric>
          <Stack spacing={0}>
            <Box textDecoration={!!position?.amount ? "underline" : "none"}>
              {fmtCompact.format(position?.amount ?? 0)}
            </Box>
            <Box fontSize="xs">
              ${fmtCompact.format(position?.marketValue ?? 0)}
            </Box>
          </Stack>
        </Td>
        <Td w="225px">
          {!publicKey ? (
            <Wallet small />
          ) : (
            <HStack>
              {!!position?.amount ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsDepositBorrowAction(false);
                    onOpen();
                  }}
                  w="90px"
                >
                  {otherBtnText}
                </Button>
              ) : (
                <Box w="90px" />
              )}
              <Button
                size="sm"
                onClick={() => {
                  setIsDepositBorrowAction(true);
                  onOpen();
                }}
                w="90px"
              >
                {btnText}
              </Button>
            </HStack>
          )}
        </Td>
      </Tr>
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isDepositBorrowAction ? btnText : otherBtnText} {reserve?.symbol}
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
            {lendingMarket === LendingMarket.MARGINFI ? (
              <Tooltip label="Marginfi not enabled at this time">
                <Button isDisabled>{btnText} </Button>
              </Tooltip>
            ) : (
              <Button
                isDisabled={!amount}
                onClick={() => txMutation.mutate()}
                isLoading={txMutation.isLoading}
              >
                {isDepositBorrowAction ? btnText : otherBtnText}
              </Button>
            )}
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
      <Box>{fmtCompact.format(numValue)}</Box>
      <Box fontSize="xs">${fmtCompact.format(numPrice * numValue)}</Box>
    </Stack>
  );
};

export default Reserve;
