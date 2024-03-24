import { KlendReserve } from "@/requests/backend";
import { getMarketIcon } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import { Box, Flex, HStack, Image, Stack, Td, Tr } from "@chakra-ui/react";

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
  return (
    <Tr>
      <Td>
        <HStack spacing="10px">
          <Flex>
            <Image
              src={asset.iconURL}
              boxSize="30px"
              borderRadius="full"
              alt="asset icon"
            />
            <Image
              src={getMarketIcon(lendingMarket)}
              boxSize="18px"
              borderRadius="full"
              alt="lending market icon"
              position="absolute"
              ml="18px"
              mt="16px"
            />
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
    </Tr>
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
