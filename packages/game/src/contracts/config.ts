import { defineChain } from 'viem'

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
})

// Contract configuration
export const CONTRACT_CONFIG = {
  // Updated after deployment to Monad Testnet with correct IPFS metadata
  ADDRESS: '0xAC33fda62B66C2Cbea0d294e4026A51518df956f', // Newly deployed proxy contract with correct NFT metadata
  GAME_ENTRY_FEE: '0.01', // 0.01 MON (must match contract GAME_ENTRY_FEE)
  CLOSED_MOUTH_THRESHOLD: 50,
  OPEN_MOUTH_THRESHOLD: 160,
}

// NFT Types enum to match contract
export const NFTType = {
  NONE: 0,
  CLOSED_MOUTH: 1,
  OPEN_MOUTH: 2,
} as const

export type NFTType = typeof NFTType[keyof typeof NFTType]

export interface PlayerStatus {
  paid: boolean
  highestScore: bigint | undefined
  mintedClosed: boolean
  mintedOpen: boolean
  canMintClosed: boolean
  canMintOpen: boolean
}