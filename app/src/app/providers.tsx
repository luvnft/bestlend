"use client";

import {
  ChakraProvider,
  createMultiStyleConfigHelpers,
  defineStyle,
  defineStyleConfig,
} from "@chakra-ui/react";
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { cardAnatomy } from "@chakra-ui/anatomy";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "react-query";

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
  owalaBeigeLight: "#f3e9cf",
};

const styles = {
  global: {
    body: {
      bg: "owalaGreen",
      color: "owalaBrown",
    },
  },
};

const baseCardStyle = definePartsStyle({
  container: {
    backgroundColor: "owalaBeige",
  },
});

const baseModalStyle = definePartsStyle({
  // @ts-ignore
  overlay: {
    bg: "rgba(46, 41, 37, 0.9)",
  },
  dialog: {
    bg: "owalaGreen",
    w: "50%",
  },
});

const baseInputStyle = definePartsStyle({
  // @ts-ignore
  field: {
    bg: "owalaBeigeLight",
    p: "8px",
    borderRadius: "5px",
  },
});

const components = {
  Card: defineMultiStyleConfig({ baseStyle: baseCardStyle }),
  Button: defineStyleConfig({
    variants: {
      solid: defineStyle({
        bg: "orange",
        _hover: {
          bg: "owalaBeigeLight",
        },
      }),
      outline: defineStyle({
        borderColor: "orange",
        bg: "owalaBeige",
      }),
    },
  }),
  Modal: defineMultiStyleConfig({ baseStyle: baseModalStyle }),
  NumberInput: defineMultiStyleConfig({ baseStyle: baseInputStyle }),
};

const theme = extendTheme({ config, colors, styles, components });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl(WalletAdapterNetwork.Devnet);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={[]}>{children}</WalletProvider>
        </ConnectionProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
