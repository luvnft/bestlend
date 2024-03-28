import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { Providers } from "./providers";

const owsald = Ubuntu({ subsets: ["latin"], weight: "500" });

export const metadata: Metadata = {
  title: "BESTLEND",
  description: "Get the best rates for your lending position",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={owsald.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
