import React, { useState, useEffect } from 'react'
import { useWeb3, usePlayerStatus } from '../hooks/useWeb3'
import { useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { WalletMain } from './WalletMain'
import { GameScoreSubmission } from './GameScoreSubmission'
import { ErrorBoundary } from './ErrorBoundary'
import MusicGame from './MusicGameNew'
import { CONTRACT_CONFIG } from '../contracts/config'
import MouthGameNFTContract from '../contracts/abi/MouthGameNFT.json'

type GamePhase = 'wallet' | 'game' | 'score-submission'

export function Web3MusicGame() {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('wallet')
  const [finalScore, setFinalScore] = useState(0)
  const [musicGameKey, setMusicGameKey] = useState(0) 

  const { address, isConnected, isCorrectNetwork, balance } = useWeb3()
  const { playerStatus } = usePlayerStatus(address)
  const { writeContractAsync } = useWriteContract()

  // Handle wallet connection state - 简化状态管理
  useEffect(() => {
    if (!isConnected) {
      setCurrentPhase('wallet')
      setFinalScore(0)
 
    } else if (isConnected && !isCorrectNetwork) {
      setCurrentPhase('wallet')
    }
  }, [isConnected, isCorrectNetwork])

  // Check if user has sufficient balance for payment
  const hasSufficientBalance = () => {
    if (!balance) return false
    const requiredAmount = BigInt(Math.floor(parseFloat(CONTRACT_CONFIG.GAME_ENTRY_FEE) * 1e18))
    return balance >= requiredAmount
  }

  // 新的支付并立即开始游戏的函数
  const handlePayAndStartGame = async () => {
    if (!isConnected) {
      alert('请先连接钱包!')
      return
    }

    if (!isCorrectNetwork) {
      alert('请切换到Monad测试网!')
      return
    }

    if (!hasSufficientBalance()) {
      alert(`余额不足！需要至少 ${CONTRACT_CONFIG.GAME_ENTRY_FEE} MON`)
      return
    }

    try {
      console.log('支付0.01 MON并开始游戏...')
      
      // 直接调用合约的 payToPlay 函数
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.ADDRESS as `0x${string}`,
        abi: MouthGameNFTContract.abi,
        functionName: 'payToPlay',
        args: [],
        value: parseEther(CONTRACT_CONFIG.GAME_ENTRY_FEE),
      })
      
      console.log('支付交易已提交:', txHash)
      
      // 立即开始游戏，不等待区块确认
      console.log('支付完成，开始游戏!')
  
      setCurrentPhase('game')
      setFinalScore(0)
      setMusicGameKey(prev => prev + 1)
      
    } catch (error) {
      console.error('支付失败:', error)
      alert('支付失败: ' + (error as Error).message)
    }
  }

  const handleGameEnd = async (score: number) => {
    console.log('Game ended with score:', score)
    setFinalScore(score)
    setCurrentPhase('score-submission')
  }

 

  // Calculate NFT eligibility based on score
  const getNFTEligibility = () => {
    if (finalScore >= CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD) {
      return { type: 'open', name: '张嘴小马NFT', threshold: CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD }
    } else if (finalScore >= CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD) {
      return { type: 'closed', name: '闭嘴小马NFT', threshold: CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD }
    }
    return null
  }

  // Render based on current phase
  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'game':
        return (
          <MusicGame 
            key={musicGameKey} 
            onGameEnd={handleGameEnd}
          />
        )

      case 'score-submission':
        return (
          <GameScoreSubmission
            finalScore={finalScore}
            nftEligibility={getNFTEligibility()}
          />
        )

      case 'wallet':
      default:
        return (
          <WalletMain 
            onStartGame={handlePayAndStartGame}
            playerStatus={playerStatus}
            balance={balance}
            hasSufficientBalance={hasSufficientBalance()}
          />
        )
    }
  }

  return (
    <div style={containerStyle}>
      <ErrorBoundary>
        {renderCurrentPhase()}
      </ErrorBoundary>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#000',
  padding: '20px',
  backgroundImage: `
    repeating-conic-gradient(#000 0deg, #000 90deg, transparent 90deg, transparent 180deg),
    repeating-conic-gradient(transparent 0deg, transparent 90deg, #111 90deg, #111 180deg)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 10px 10px',
}

export default Web3MusicGame