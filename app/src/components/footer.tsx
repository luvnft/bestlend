import { HStack, IconButton, Spacer } from "@chakra-ui/react";
import { GithubLink, TelegramLink, TwitterLink } from "./link_icons";
import { InfoOutlineIcon } from "@chakra-ui/icons";

const Footer = ({ faqsOpen }: { faqsOpen: () => void }) => {
  return (
    <HStack>
      <Spacer />
      <TwitterLink />
      <TelegramLink />
      <GithubLink />
      <IconButton
        icon={<InfoOutlineIcon />}
        aria-label="github link"
        variant="ghost"
        onClick={faqsOpen}
      />
    </HStack>
  );
};

export default Footer;
