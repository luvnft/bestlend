import { getObligation, getStakingRates } from "@/requests/backend";
import { ASSETS_MINTS } from "@/utils/consts";
import { fmtCurrency, fmtPct } from "@/utils/fmt";
import { SunIcon } from "@chakra-ui/icons";
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
  Tooltip,
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

  const ratesQuery = useQuery("stakingRates", () => getStakingRates());
  const rate = ratesQuery.data ?? {};

  const stakingRate = obligation.data?.deposits
    .map((d) => rate[ASSETS_MINTS[d.mint.toBase58()].ticker])
    .filter(Boolean)?.[0];

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

  const effAPY = obligation.data?.effectiveAPY ?? 0;

  return (
    <HStack spacing="2rem" my="4rem">
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>Net Value</StatLabel>
            <StatNumber>
              {fmtCurrency.format(obligation.data?.nav ?? 0)}
            </StatNumber>
            <StatHelpText>0 SOL</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>Effective APY</StatLabel>
            <StatNumber>
              {fmtPct.format(effAPY)}
              {stakingRate && (
                <Tooltip
                  label={`${fmtPct.format(
                    parseFloat(stakingRate)
                  )} staking reward`}
                  placement="top-start"
                >
                  <SunIcon
                    fontSize="md"
                    color="owalaOrange"
                    mt="-16px"
                    ml="5px"
                  />
                </Tooltip>
              )}
            </StatNumber>
            <StatHelpText>
              {fmtCurrency.format(effAPY * (obligation.data?.nav ?? 0))} / year
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat minW="150px">
            <StatLabel>LTV</StatLabel>
            <StatNumber>{obligation.data?.ltv ?? 0}</StatNumber>
            <StatHelpText>loan to value</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </HStack>
  );
};

export default Stats;
