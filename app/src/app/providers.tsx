"use client";

import {
  ChakraProvider,
  createMultiStyleConfigHelpers,
} from "@chakra-ui/react";
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { cardAnatomy } from "@chakra-ui/anatomy";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  owalaOrange: "rgba(246, 158, 59)",
  owalaGreen: "rgba(169, 181, 145)",
  owalaBrown: "rgba(46, 41, 37)",
  owalaBeige: "rgba(238, 223, 187)",
};

const styles = {
  global: {
    body: {
      bg: "owalaGreen",
      color: "owalaBrown",
    },
  },
};

const baseStyle = definePartsStyle({
  container: {
    backgroundColor: "owalaBeige",
  },
});

const components = {
  Card: defineMultiStyleConfig({ baseStyle }),
};

const theme = extendTheme({ config, colors, styles, components });

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
