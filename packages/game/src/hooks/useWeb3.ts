import React, { useMemo } from 'react'
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
  useBalance
} from 'wagmi'
import { parseEther } from 'viem'
import { CONTRACT_CONFIG, monadTestnet, type PlayerStatus } from '../contracts/config'
import MouthGameNFTContract from '../contracts/abi/MouthGameNFT.json'
const MouthGameNFTABI = MouthGameNFTContract.abi

export function useWeb3() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // Get user's balance
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    chainId: monadTestnet.id,
  })

  // Check if we're on the correct network
  const isCorrectNetwork = useMemo(() => {
    return chainId === monadTestnet.id
  }, [chainId])

  // Switch to Monad Testnet
  const switchToMonad = () => {
    if (switchChain) {
      switchChain({ chainId: monadTestnet.id })
    }
  }

  // Connect to MetaMask
  const connectWallet = () => {
    const metaMaskConnector = connectors.find(
      connector => connector.name === 'MetaMask'
    )
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    }
  }

  return {
    address,
    isConnected,
    isCorrectNetwork,
    connect: connectWallet,
    disconnect,
    switchToMonad,
    chainId,
    balance: balance?.value,
    refetchBalance,
  }
}

export function usePlayerStatus(address?: `0x${string}`) {
  const { data: rawData, refetch, error, isLoading } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: MouthGameNFTABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_CONFIG.ADDRESS,
      retry: 3,
      retryDelay: 1000,
      // Force fresh data on every call to avoid caching issues
      staleTime: 0,
      gcTime: 0,
    }
  })

  // 添加独立的 hasPaidToPlay 检查
  const { data: paidData } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: MouthGameNFTABI,
    functionName: 'hasPaidToPlay',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_CONFIG.ADDRESS,
      staleTime: 0,
      gcTime: 0,
    }
  })

  // Convert raw contract data to PlayerStatus format
  const playerStatus: PlayerStatus | undefined = React.useMemo(() => {
    if (!rawData) {
      return undefined
    }
    
    // 辅助函数：安全转换为布尔值
    const safeBooleanConvert = (value: any): boolean => {
      // 检查 null, undefined, 0, false, "false", ""
      if (value === null || value === undefined || value === 0 || value === false || value === "false" || value === "") {
        return false
      }
      // 检查 true, 1, "true", "1"
      if (value === true || value === 1 || value === "true" || value === "1") {
        return true
      }
      // 其他情况使用 Boolean() 转换，但记录警告
      console.warn('⚠️ Unexpected boolean value:', value, typeof value)
      return Boolean(value)
    }
    
    // Handle different possible return formats
    if (Array.isArray(rawData) && rawData.length === 6) {
      return {
        paid: safeBooleanConvert(rawData[0]),
        highestScore: rawData[1] ? BigInt(rawData[1]) : BigInt(0),
        mintedClosed: safeBooleanConvert(rawData[2]),
        mintedOpen: safeBooleanConvert(rawData[3]),
        canMintClosed: safeBooleanConvert(rawData[4]),
        canMintOpen: safeBooleanConvert(rawData[5]),
      }
    }
    
    // Handle object format (in case wagmi returns object instead of array)
    if (typeof rawData === 'object' && 'paid' in rawData) {
      return {
        paid: safeBooleanConvert((rawData as any).paid),
        highestScore: (rawData as any).highestScore ? BigInt((rawData as any).highestScore) : BigInt(0),
        mintedClosed: safeBooleanConvert((rawData as any).mintedClosed),
        mintedOpen: safeBooleanConvert((rawData as any).mintedOpen),
        canMintClosed: safeBooleanConvert((rawData as any).canMintClosed),
        canMintOpen: safeBooleanConvert((rawData as any).canMintOpen),
      }
    }
    
    return undefined
  }, [rawData])

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 usePlayerStatus Debug:', {
      address,
      contractAddress: CONTRACT_CONFIG.ADDRESS,
      rawData,
      rawDataType: typeof rawData,
      rawDataIsArray: Array.isArray(rawData),
      rawDataLength: Array.isArray(rawData) ? rawData.length : 'not array',
      rawDataValues: Array.isArray(rawData) ? rawData.map((val, idx) => `[${idx}]: ${val} (${typeof val})`) : 'not array',
      independentPaidData: paidData,
      independentPaidType: typeof paidData,
      playerStatus,
      parsedPlayerStatus: playerStatus ? {
        paid: playerStatus.paid,
        highestScore: playerStatus.highestScore?.toString() || 'undefined',
        mintedClosed: playerStatus.mintedClosed,
        mintedOpen: playerStatus.mintedOpen,
        canMintClosed: playerStatus.canMintClosed,
        canMintOpen: playerStatus.canMintOpen,
      } : null,
      error: error?.message,
      isLoading,
      enabled: !!address && !!CONTRACT_CONFIG.ADDRESS,
    })
    
    // 特别检查 paid 状态的原始值
    if (Array.isArray(rawData) && rawData.length > 0) {
      console.log('⚠️  PAID STATUS RAW VALUE:', {
        rawPaidValue: rawData[0],
        rawPaidType: typeof rawData[0],
        booleanConversion: Boolean(rawData[0]),
        strictEquality: rawData[0] === true,
        looseEquality: rawData[0] == true,
        independentHasPaidToPlay: paidData,
        independentPaidType: typeof paidData,
        valuesMatch: Boolean(rawData[0]) === Boolean(paidData),
      })
    }
  }, [address, rawData, paidData, playerStatus, error, isLoading])

  return {
    playerStatus,
    refetchPlayerStatus: refetch,
    error,
    isLoading,
  }
}

export function usePayToPlay() {
  const { writeContractAsync, data, isPending } = useWriteContract()

  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: data,
  })

  const payToPlay = async () => {
    if (writeContractAsync) {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: MouthGameNFTABI,
        functionName: 'payToPlay',
        args: [],
        value: parseEther(CONTRACT_CONFIG.GAME_ENTRY_FEE),
      })
    }
  }

  return {
    payToPlay,
    isLoading: isPending || isTransactionLoading,
    isSuccess,
    data,
  }
}

export function useMintNFT() {
  const { writeContract: writeContractClosed, data: dataClosedMouth, isPending: isPendingClosed } = useWriteContract()
  const { writeContract: writeContractOpen, data: dataOpenMouth, isPending: isPendingOpen } = useWriteContract()

  const { isLoading: isTransactionLoadingClosed, isSuccess: isSuccessClosed } = useWaitForTransactionReceipt({
    hash: dataClosedMouth,
  })

  const { isLoading: isTransactionLoadingOpen, isSuccess: isSuccessOpen } = useWaitForTransactionReceipt({
    hash: dataOpenMouth,
  })

  const mintClosedMouth = () => {
    writeContractClosed({
      address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
      abi: MouthGameNFTABI,
      functionName: 'mintClosedMouthNFT',
      args: [],
    })
  }

  const mintOpenMouth = () => {
    writeContractOpen({
      address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
      abi: MouthGameNFTABI,
      functionName: 'mintOpenMouthNFT',
      args: [],
    })
  }

  return {
    mintClosedMouth,
    mintOpenMouth,
    isMintingClosed: isPendingClosed || isTransactionLoadingClosed,
    isMintingOpen: isPendingOpen || isTransactionLoadingOpen,
    isSuccessClosed,
    isSuccessOpen,
    dataClosedMouth,
    dataOpenMouth,
  }
}

export function useRecordScore() {
  const { writeContractAsync } = useWriteContract()

  const recordScore = async (score: number) => {
    if (writeContractAsync) {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: MouthGameNFTABI,
        functionName: 'recordScore',
        args: [score],
      })
    }
  }

  return { recordScore }
}

export function useStartGame() {
  const { writeContractAsync } = useWriteContract()

  const startGame = async () => {
    if (writeContractAsync) {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: MouthGameNFTABI,
        functionName: 'startGame',
        args: [],
      })
    }
  }

  return { startGame }
}

export function useResetPlayerPayment() {
  const { writeContractAsync } = useWriteContract()

  const resetPlayerPayment = async (playerAddress: string) => {
    if (writeContractAsync) {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: MouthGameNFTABI,
        functionName: 'resetPlayerPayment',
        args: [playerAddress],
      })
    }
  }

  return { resetPlayerPayment }
}

// 新增：专门用于调试的钩子，检查各种合约状态
export function useContractDebug(address?: `0x${string}`) {
  // 直接调用 hasPaidToPlay
  const { data: hasPaidData } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: MouthGameNFTABI,
    functionName: 'hasPaidToPlay',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 0,
    }
  })

  // 直接调用 playerHighestScores
  const { data: highestScoreData } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: MouthGameNFTABI,
    functionName: 'playerHighestScores',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 0,
    }
  })

  // 检查合约常量
  const { data: gameEntryFee } = useReadContract({
    address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
    abi: MouthGameNFTABI,
    functionName: 'GAME_ENTRY_FEE',
    query: { staleTime: 60000 }
  })

  return {
    hasPaidData,
    highestScoreData,
    gameEntryFee,
    debugInfo: {
      address,
      contractAddress: CONTRACT_CONFIG.ADDRESS,
      hasPaidToPlay: hasPaidData,
      playerHighestScore: highestScoreData?.toString(),
      gameEntryFeeFromContract: gameEntryFee?.toString(),
      configGameEntryFee: CONTRACT_CONFIG.GAME_ENTRY_FEE,
    }
  }
}