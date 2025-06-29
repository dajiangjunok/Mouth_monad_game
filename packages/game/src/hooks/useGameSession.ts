import { useState, useEffect } from 'react'
import { useWeb3, usePlayerStatus, useRecordScore, useStartGame } from './useWeb3'

interface GameSessionState {
  hasActivePaidSession: boolean
  gameInProgress: boolean
  currentScore: number
}

export function useGameSession() {
  const { address } = useWeb3()
  const { playerStatus, refetchPlayerStatus } = usePlayerStatus(address)
  const { recordScore } = useRecordScore()
  const { startGame } = useStartGame()
  
  const [gameState, setGameState] = useState<GameSessionState>({
    hasActivePaidSession: false,
    gameInProgress: false,
    currentScore: 0
  })

  // Update game state when player status changes
  useEffect(() => {
    if (playerStatus) {
      setGameState(prev => ({
        ...prev,
        hasActivePaidSession: playerStatus.paid,
      }))
    }
  }, [playerStatus])

  // Start a new game session
  const startGameSession = async () => {
    if (!playerStatus?.paid) {
      throw new Error('请先支付游戏费用!')
    }
    
    if (!address) {
      throw new Error('钱包未连接!')
    }

    try {
      console.log('Starting game session for address:', address)
      
      // Call the smart contract startGame function
      // This will reset the payment status on the blockchain
      await startGame()
      console.log('Smart contract startGame called successfully')
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        hasActivePaidSession: false, // Payment status reset by contract
        gameInProgress: true,
        currentScore: 0
      }))

      console.log('Game session started successfully')
      return true
    } catch (error) {
      console.error('启动游戏会话失败:', error)
      throw error
    }
  }

  // End game session and record score
  const endGameSession = async (finalScore: number) => {
    if (!address) {
      throw new Error('钱包未连接!')
    }

    try {
      console.log(`Recording final score: ${finalScore}`)
      
      // Record the final score on blockchain
      const result = await recordScore(finalScore)
      console.log('Score recording transaction:', result)
      
      // Update local state
      setGameState(prev => ({
        ...prev,
        gameInProgress: false,
        currentScore: finalScore
      }))

      // Refresh player status to get updated NFT eligibility
      console.log('Refreshing player status after score recording...')
      await refetchPlayerStatus()

      console.log('Game session ended successfully')
      return true
    } catch (error) {
      console.error('记录游戏分数失败:', error)
      throw error
    }
  }

  // Update current score during gameplay (local only)
  const updateCurrentScore = (score: number) => {
    setGameState(prev => ({
      ...prev,
      currentScore: score
    }))
  }

  // Reset game state
  const resetGameState = () => {
    setGameState({
      hasActivePaidSession: false,
      gameInProgress: false,
      currentScore: 0
    })
  }

  return {
    gameState,
    startGameSession,
    endGameSession,
    updateCurrentScore,
    resetGameState,
    canStartGame: playerStatus?.paid || false,
  }
}