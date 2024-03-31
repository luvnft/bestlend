import { HStack, Spacer } from "@chakra-ui/react";
import { GithubLink, TwitterLink } from "./github";

const Footer = () => {
  return (
    <HStack>
      <Spacer />
      <TwitterLink />
      <GithubLink />
    </HStack>
  );
};

export default Footer;
