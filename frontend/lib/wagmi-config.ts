import { createConfig, http } from "wagmi"
import { mainnet, polygon, sepolia, baseSepolia } from "wagmi/chains"

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, sepolia, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
})
