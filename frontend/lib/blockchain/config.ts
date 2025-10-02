export const BLOCKCHAIN_CONFIG = {
  // USDC contract addresses on different networks
  USDC_CONTRACTS: {
    1: "0xA0b86a33E6441b8C4505E2E8b4C3D7F1c8E8E8E8", // Ethereum Mainnet USDC
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC (testnet)
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" ,// base USDC contract for Sepolia
  },

  // Supported networks
  NETWORKS: {
    MAINNET: 1,
    POLYGON: 137,
    SEPOLIA: 11155111,
    BASE: 84532, // Base Sepolia
  },

  // Default network
  // DEFAULT_NETWORK: process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "mainnet" ? 1 : 11155111,
  DEFAULT_NETWORK: 84532, // Default to Sepolia for testing

  // USDC decimals (6 decimals, not 18 like ETH)
  USDC_DECIMALS: 6,

  // Gas settings for ERC-20 operations
  GAS_LIMIT: {
    TRANSFER: 65000,
    APPROVE: 50000,
  },

  // Transaction confirmations
  CONFIRMATIONS_REQUIRED: 2,
}

// Standard ERC-20 ABI for USDC
export const USDC_ABI = [
  // Standard ERC-20 functions
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const

// Export STABLECOIN_ABI as alias for backward compatibility
export const STABLECOIN_ABI = USDC_ABI

// Helper function to get USDC contract address for current network
export const getUSDCAddress = (chainId: number): string => {
  return (
    BLOCKCHAIN_CONFIG.USDC_CONTRACTS[chainId as keyof typeof BLOCKCHAIN_CONFIG.USDC_CONTRACTS] ||
    BLOCKCHAIN_CONFIG.USDC_CONTRACTS[84532] // Fallback to Base Sepolia if not found
  )
}

// Helper function to format USDC amounts (6 decimals)
export const formatUSDCAmount = (amount: bigint): string => {
  return (Number(amount) / Math.pow(10, BLOCKCHAIN_CONFIG.USDC_DECIMALS)).toFixed(2)
}

// Helper function to parse USDC amounts (6 decimals)
export const parseUSDCAmount = (amount: string): bigint => {
  return BigInt(Math.floor(Number.parseFloat(amount) * Math.pow(10, BLOCKCHAIN_CONFIG.USDC_DECIMALS)))
}
