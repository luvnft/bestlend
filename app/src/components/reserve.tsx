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
  Link,
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
import { useMutation, useQuery, useQueryClient } from "react-query";
import { fmtCompact, fmtPct } from "@/utils/fmt";
import { getBestLendAccount } from "@/requests/bestlend";
import { db } from "@/utils/db";
import { track } from "@vercel/analytics";

interface Props {
  asset: Asset;
  lendingMarket: LendingMarket;
  reserve?: KlendReserve;
  depositGroup: AssetGroup;
}

const Reserve = ({ asset, lendingMarket, reserve, depositGroup }: Props) => {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

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

  // limit how much users can take from reserves
  const borrowMax =
    asset.asset_group === AssetGroup.STABLE
      ? Math.min(obligation.data?.borrowLeft ?? 100, 100)
      : 1;
  const overMax = !isDeposit && amount > borrowMax && isDepositBorrowAction;

  const getAction = () => {
    if (isDeposit || !bestlendAccount.isSuccess)
      return isDepositBorrowAction ? getDepositTx : getWithdrawTx;
    return isDepositBorrowAction ? getBorrowTx : getRepayTx;
  };

  const addAction = async (signature: string) => {
    const message = isDepositBorrowAction ? btnText : otherBtnText;
    console.log(`saving ${message} to db`);
    db.publishedActions
      .add({
        message,
        details: `You performed a ${message} of ${amount} ${asset.ticker}`,
        ts: new Date().toJSON(),
        signature,
        address: publicKey!.toBase58(),
        amount,
      })
      .catch((e) => console.error(`error adding db entry: ${e}`));
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
      for (let i = 0; i < txs.length; i++) {
        try {
          const sig = await sendTransaction(txs[i], connection);
          // const tx = await signTransaction!(txs[i]);
          // const sig = await connection.sendRawTransaction(tx.serialize(), {
          //   skipPreflight: true,
          // });
          if (i === 0) addAction(sig);

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
      track("walletAction", {
        action: isDepositBorrowAction ? btnText : otherBtnText,
      });
      queryClient.invalidateQueries({ queryKey: ["getObligation"] });
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
              {balance?.balance === 0 && reserve?.symbol === "SOL" && (
                <Link href="https://faucet.solana.com/" isExternal>
                  <Box my="10px" float="right">
                    Airdrop devnet SOL: faucet.solana.com
                  </Box>
                </Link>
              )}
              {overMax && (
                <Box float="right">{`You cannot borrow more than ${borrowMax} ${reserve?.symbol}`}</Box>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            {lendingMarket === LendingMarket.MARGINFI ? (
              <Tooltip label="Marginfi not enabled at this time">
                <Button isDisabled>{btnText} </Button>
              </Tooltip>
            ) : (
              <Button
                isDisabled={!amount || overMax}
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
