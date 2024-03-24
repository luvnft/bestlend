import { Box, HStack, Spacer } from "@chakra-ui/react";
import { Audiowide } from "next/font/google";
import Wallet from "./wallet";

const font = Audiowide({ weight: "400", subsets: ["latin"] });

const NavBar = () => {
  return (
    <HStack px="1rem">
      <Box fontSize="3xl" fontWeight="bold" className={font.className}>
        BESTLEND
      </Box>
      <Box color="owalaOrange" fontSize="lg" ml="-7px" mt="8px">
        &#9679;
      </Box>
      <Spacer />
      <Wallet />
    </HStack>
  );
};

export default NavBar;
