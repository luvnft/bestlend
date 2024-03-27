import { getObligation } from "@/requests/backend";
import { fmtCurrency } from "@/utils/fmt";
import {
  Box,
  Card,
  CardBody,
  Flex,
  HStack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  chakra,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "react-query";

const Stats = () => {
  const { publicKey } = useWallet();

  const obligation = useQuery(
    "getObligation",
    () => getObligation(publicKey!),
    { enabled: !!publicKey }
  );

  let value = 0;
  obligation.data?.borrows.forEach((b) => {
    value -= b.marketValue;
  });
  obligation.data?.deposits.forEach((b) => {
    value += b.marketValue;
  });

  if (!publicKey) {
    return (
      <Box my="4rem">
        <Flex>
          <Box fontSize="3xl">
            Connect your wallet and deposit to start optimizing your yield
            <chakra.span color="owalaOrange" fontSize="lg" ml="3px">
              &#9679;
            </chakra.span>
          </Box>
        </Flex>
        <Text
          fontSize="xl"
          textDecoration="underline"
          textDecorationColor="owalaOrange"
        >
          Bestlend will move your debt and collateral to like assets in order to
          optimize your yield. Deposit in one group of assets and borrow from
          another knowing your position is optimized regardless of changes in
          staking or borrow rates.
        </Text>
      </Box>
    );
  }

  return (
    <HStack spacing="2rem" my="4rem">
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>Net Value</StatLabel>
            <StatNumber>{fmtCurrency.format(value)}</StatNumber>
            <StatHelpText>0 SOL</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>Effective APY</StatLabel>
            <StatNumber>25.00%</StatNumber>
            <StatHelpText>$0.00 / year</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>LTV</StatLabel>
            <StatNumber>0.75</StatNumber>
            <StatHelpText>loan to value</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </HStack>
  );
};

export default Stats;
