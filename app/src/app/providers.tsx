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
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { Analytics } from "@vercel/analytics/react";
import { withScope, captureException } from "@sentry/nextjs";
import { useMemo } from "react";

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

const tableTheme = {
  variants: {
    simple: {
      th: {
        borderColor: "owalaOrange",
        borderWidth: "0 0 2px 0",
      },
      td: {
        borderColor: "owalaOrange",
        borderWidth: "0 0 2px 0",
      },
    },
  },
};

const drawerStyles = definePartsStyle({
  // @ts-ignore
  dialog: {
    bg: `owalaGreen`,
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
  Table: tableTheme,
  Modal: defineMultiStyleConfig({ baseStyle: baseModalStyle }),
  NumberInput: defineMultiStyleConfig({ baseStyle: baseInputStyle }),
  Drawer: {
    baseStyle: drawerStyles,
  },
};

const theme = extendTheme({ config, colors, styles, components });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
  mutationCache: new MutationCache({
    onError: (err, _variables, _context, mutation) => {
      withScope((scope) => {
        scope.setContext("mutation", {
          mutationId: mutation.mutationId,
          variables: mutation.state.variables,
        });
        if (mutation.options.mutationKey) {
          scope.setFingerprint(
            // Duplicate to prevent modification
            Array.from(mutation.options.mutationKey) as string[]
          );
        }
        captureException(err);
      });
    },
  }),
  queryCache: new QueryCache({
    onError: (err, query) => {
      withScope((scope) => {
        scope.setContext("query", { queryHash: query.queryHash });
        scope.setFingerprint([query.queryHash.replaceAll(/[0-9]/g, "0")]);
        captureException(err);
      });
    },
  }),
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
        <Analytics />
      </ChakraProvider>
    </QueryClientProvider>
  );
}
