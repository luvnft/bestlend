import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Input,
  Spacer,
  useDisclosure,
} from "@chakra-ui/react";
import { GithubLink, TwitterLink } from "./github";
import { InfoOutlineIcon } from "@chakra-ui/icons";

const Footer = ({ faqsOpen }: { faqsOpen: () => void }) => {
  return (
    <HStack>
      <Spacer />
      <TwitterLink />
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
