import { getMarketIcon } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import { Box, HStack, Image } from "@chakra-ui/react";

interface Props {
  asset: Asset;
  lendingMarket: LendingMarket;
}

const Reserve = ({ asset, lendingMarket }: Props) => {
  return (
    <HStack spacing="10px">
      <Image
        src={getMarketIcon(lendingMarket)}
        boxSize="30px"
        borderRadius="full"
        alt="lending market icon"
      />
      <Image
        src={asset.iconURL}
        boxSize="30px"
        borderRadius="full"
        alt="asset icon"
      />
      <Box>{asset.ticker}</Box>
    </HStack>
  );
};

export default Reserve;
