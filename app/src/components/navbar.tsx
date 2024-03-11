import { Box, HStack } from "@chakra-ui/react";
import { Audiowide } from "next/font/google";

const font = Audiowide({ weight: "400", subsets: ["latin"] });

const NavBar = () => {
  return (
    <HStack px="1rem">
      <Box fontSize="3xl" fontWeight="bold" className={font.className}>
        BESTLEND
      </Box>
    </HStack>
  );
};

export default NavBar;
