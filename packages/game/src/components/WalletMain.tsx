import { useState } from 'react'
import { WalletDashboard } from './WalletDashboard'
import { NFTGallery } from './NFTGallery'
import { WalletConnection } from './WalletConnection'
import { useWeb3 } from '../hooks/useWeb3'
import { type PlayerStatus } from '../contracts/config'

interface WalletMainProps {
  onStartGame: () => Promise<void>
  playerStatus?: PlayerStatus
  balance?: bigint
  hasSufficientBalance: boolean
}

type ViewMode = 'dashboard' | 'connection' | 'nfts'

export function WalletMain({ 
  onStartGame, 
  playerStatus, 
  balance, 
  hasSufficientBalance 
}: WalletMainProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const { isConnected } = useWeb3()

  // If wallet not connected, show connection interface
  if (!isConnected) {
    return (
      <WalletConnection 
        onPayToPlay={onStartGame}
        playerStatus={playerStatus}
        balance={balance}
        hasSufficientBalance={hasSufficientBalance}
      />
    )
  }

  const handleStartGame = async () => {
    console.log('WalletMain: Starting game...')
    try {
      await onStartGame()
      console.log('WalletMain: Game started successfully')
    } catch (error) {
      console.error('WalletMain: Failed to start game:', error)
    }
  }

  const handleNavigateToNFTs = () => {
    setViewMode('nfts')
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
  }

  // Render appropriate view based on current mode
  switch (viewMode) {
    case 'nfts':
      return <NFTGallery onBack={handleBackToDashboard} />
    
    case 'connection':
      return (
        <WalletConnection 
          onPayToPlay={onStartGame}
          playerStatus={playerStatus}
          balance={balance}
          hasSufficientBalance={hasSufficientBalance}
        />
      )
    
    case 'dashboard':
    default:
      return (
        <WalletDashboard 
          onNavigateToGame={handleStartGame}
          onNavigateToNFTs={handleNavigateToNFTs}
          playerStatus={playerStatus}
          balance={balance}
          hasSufficientBalance={hasSufficientBalance}
        />
      )
  }
}

export default WalletMain