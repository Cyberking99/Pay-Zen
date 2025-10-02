import type { PrivyClientConfig } from "@privy-io/react-auth"

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "email"],
  appearance: {
    theme: "dark",
    accentColor: "#0D9488",
    logo: "/logo.png",
    showWalletLoginFirst: true,
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
    requireUserPasswordOnCreate: false,
  },
  mfa: {
    noPromptOnMfaRequired: false,
  },
  defaultChain: {
    id: 84532,
    name: "Base Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["https://sepolia.base.org"],
      },
    },
    blockExplorers: {
      default: {
        name: "Base Sepolia Explorer",
        url: "https://sepolia.basescan.org",
      },
    },
  },
  // defaultChain: {
  //   id: 84532,
  //   rpcUrls: {
  //     default: "https://sepolia.base.org",
  //   },
  //   blockExplorers: {
  //     default: {
  //       name: "Base Sepolia Explorer",
  //       url: "https://sepolia.basescan.org",
  //     },
  //   },
  // },
}
