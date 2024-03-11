import { getMarketIcon } from "@/utils/consts";
import { Asset, LendingMarket } from "@/utils/models";
import { Box, Flex, HStack, Image } from "@chakra-ui/react";

interface Props {
  asset: Asset;
  lendingMarket: LendingMarket;
}

const Reserve = ({ asset, lendingMarket }: Props) => {
  return (
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
  );
};

export default Reserve;
