import { useWeb3 } from '../hooks/useWeb3'
import { CONTRACT_CONFIG, type PlayerStatus } from '../contracts/config'

interface WalletConnectionProps {
  onPayToPlay: () => Promise<void>
  playerStatus?: PlayerStatus
  balance?: bigint
  hasSufficientBalance: boolean
}

export function WalletConnection({ 
  onPayToPlay,
  playerStatus,
  balance,
  hasSufficientBalance
}: WalletConnectionProps) {
  const { address, isConnected, isCorrectNetwork, connect, disconnect, switchToMonad } = useWeb3()

  // Format balance for display
  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00'
    try {
      const balanceStr = balance.toString()
      const formatted = Number(balanceStr) / 1e18
      return formatted.toFixed(4)
    } catch {
      return '0.00'
    }
  }

  // Format score for display
  const getScoreDisplay = (score: bigint | undefined): string => {
    if (!score) return '0'
    try {
      return score.toString()
    } catch {
      return '0'
    }
  }

  const handlePayToPlay = async () => {
    try {
      await onPayToPlay()
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }



  if (!isConnected) {
    return (
      <div className="pixel-wallet">
        <div className="pixel-panel main-panel">
          <div className="panel-title">🐎 一起来嘴炮</div>
          <div className="welcome-message">连接您的钱包开始游戏!</div>
          <div className="connect-instruction">请使用MetaMask钱包连接</div>
          <button onClick={connect} className="pixel-btn start-game-btn">
            连接MetaMask钱包
          </button>
        </div>
        <style>{pixelStyles}</style>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="pixel-wallet">
        <div className="pixel-panel main-panel">
          <div className="panel-title">❌ 网络错误</div>
          <div className="welcome-message">请切换到Monad测试网</div>
          <div className="connect-instruction">当前网络不支持，需要切换网络</div>
          <button onClick={switchToMonad} className="pixel-btn start-game-btn">
            切换到Monad测试网
          </button>
          <button onClick={() => disconnect()} className="pixel-btn disconnect-btn">
            断开连接
          </button>
        </div>
        <style>{pixelStyles}</style>
      </div>
    )
  }

  return (
    <div className="pixel-wallet">
      <div className="pixel-panel main-panel">
        <div className="panel-title">🐎 一起来嘴炮</div>
        <div className="welcome-message">钱包已连接成功！</div>
        
        <div className="wallet-info-simple">
          <div className="info-item">
            <span className="label">地址:</span>
            <span className="value">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          <div className="info-item">
            <span className="label">余额:</span>
            <span className="value">{formatBalance(balance)} MON</span>
          </div>
          <div className="info-item">
            <span className="label">最高分:</span>
            <span className="value">{getScoreDisplay(playerStatus?.highestScore)}</span>
          </div>
        </div>

        <div className="game-rules-simple">
          <div className="rule-title">🎯 游戏规则:</div>
          <div className="rule-item">• 达到 {CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD} 分获得闭嘴小马NFT</div>
          <div className="rule-item">• 达到 {CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD} 分获得张嘴小马NFT</div>
          <div className="rule-item">• 每次游戏需要支付 {CONTRACT_CONFIG.GAME_ENTRY_FEE} MON</div>
        </div>

        <div className="nft-status-simple">
          <div className="nft-item">
            <span className="nft-icon">{playerStatus?.mintedClosed ? '✅' : '❌'}</span>
            <span className="nft-name">闭嘴小马NFT</span>
            {playerStatus?.canMintClosed && !playerStatus?.mintedClosed && (
              <span className="can-mint">可获得!</span>
            )}
          </div>
          <div className="nft-item">
            <span className="nft-icon">{playerStatus?.mintedOpen ? '✅' : '❌'}</span>
            <span className="nft-name">张嘴小马NFT</span>
            {playerStatus?.canMintOpen && !playerStatus?.mintedOpen && (
              <span className="can-mint">可获得!</span>
            )}
          </div>
        </div>

        <div className="game-start-section">
          <div className="entry-fee">
            游戏费用: <strong>{CONTRACT_CONFIG.GAME_ENTRY_FEE} MON</strong>
          </div>
          {!hasSufficientBalance ? (
            <div className="insufficient-balance">
              ⚠️ 余额不足，需要至少 {CONTRACT_CONFIG.GAME_ENTRY_FEE} MON
            </div>
          ) : (
            <div className="ready-message">准备开始游戏</div>
          )}
          
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('支付并开始游戏按钮被点击')
              handlePayToPlay()
            }} 
            disabled={!hasSufficientBalance}
            className="pixel-btn start-game-btn"
          >
            开始游戏
          </button>
          
          <button 
            onClick={() => disconnect()} 
            className="pixel-btn disconnect-btn"
          >
            断开钱包
          </button>
        </div>
      </div>
      <style>{pixelStyles}</style>
    </div>
  )
}

const pixelStyles = `
  .pixel-wallet {
    width: 100vw;
    height: 100vh;
    background: #f5f5dc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    font-family: 'Microsoft YaHei', SimSun, serif;
  }

  /* Pixel Panel Base Style - 模仿游戏边框 */
  .pixel-panel {
    background: #f5f5dc;
    border: 4px solid #000;
    border-radius: 0;
    position: relative;
    /* 双重边框效果 */
    box-shadow: 
      inset -2px -2px 0 #888,
      inset 2px 2px 0 #fff,
      -2px -2px 0 #fff,
      2px 2px 0 #888;
  }

  .panel-title {
    background: #ddd;
    color: #000;
    font-weight: bold;
    font-size: 14px;
    padding: 8px 12px;
    margin: 0;
    border-bottom: 2px solid #000;
    text-align: center;
  }

  .main-panel {
    padding: 40px;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .main-panel .panel-title {
    font-size: 24px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .welcome-message {
    font-size: 18px;
    margin: 20px 0;
    color: #000;
  }

  .connect-instruction {
    font-size: 16px;
    color: #333;
    margin: 15px 0;
  }

  /* Wallet Info Simple */
  .wallet-info-simple {
    background: #f0f0f0;
    padding: 15px;
    margin: 20px 0;
    border: 2px solid #ccc;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
    font-size: 14px;
  }

  .label {
    color: #333;
    font-weight: 500;
  }

  .value {
    color: #000;
    font-weight: bold;
    font-family: monospace;
  }

  /* Game Rules Simple */
  .game-rules-simple {
    margin: 20px 0;
    text-align: left;
  }

  .rule-title {
    font-weight: bold;
    margin: 15px 0 10px 0;
    color: #000;
    text-align: center;
  }

  .rule-item {
    margin: 5px 0;
    padding: 3px 0;
    font-size: 13px;
    color: #333;
    line-height: 1.4;
  }

  /* NFT Status Simple */
  .nft-status-simple {
    background: #f0f0f0;
    padding: 15px;
    margin: 20px 0;
    border: 2px solid #ccc;
  }

  .nft-item {
    display: flex;
    align-items: center;
    margin: 8px 0;
    font-size: 12px;
  }

  .nft-icon {
    margin-right: 8px;
    width: 16px;
  }

  .nft-name {
    flex: 1;
    color: #333;
  }

  .can-mint {
    background: #32CD32;
    color: white;
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 2px;
  }

  /* Game Start Section */
  .game-start-section {
    text-align: center;
    padding: 20px 0;
    border-top: 2px solid #ccc;
    margin-top: 20px;
  }

  .entry-fee {
    font-size: 16px;
    margin: 10px 0;
    color: #000;
  }

  .ready-message {
    color: #32CD32;
    font-weight: bold;
    margin: 10px 0;
  }

  .insufficient-balance {
    color: #DC143C;
    font-weight: bold;
    margin: 10px 0;
    font-size: 14px;
  }

  /* Pixel Buttons - 模仿游戏按钮风格 */
  .pixel-btn {
    background: #f5f5dc;
    border: 3px solid #000;
    color: #000;
    font-weight: bold;
    font-family: inherit;
    cursor: pointer;
    position: relative;
    transition: all 0.1s;
    /* 双重边框效果 */
    box-shadow: 
      inset -1px -1px 0 #888,
      inset 1px 1px 0 #fff;
  }

  .pixel-btn:hover:not(:disabled) {
    background: #fff;
    box-shadow: 
      inset -1px -1px 0 #aaa,
      inset 1px 1px 0 #fff;
  }

  .pixel-btn:active:not(:disabled) {
    box-shadow: 
      inset 1px 1px 0 #888,
      inset -1px -1px 0 #fff;
  }

  .pixel-btn:disabled {
    background: #ccc;
    color: #888;
    cursor: not-allowed;
    box-shadow: 
      inset -1px -1px 0 #999,
      inset 1px 1px 0 #eee;
  }

  .start-game-btn {
    padding: 15px 30px;
    font-size: 16px;
    margin: 15px 5px;
    min-width: 200px;
  }

  .disconnect-btn {
    padding: 10px 15px;
    font-size: 12px;
    margin: 5px;
    background: #ffcccc;
    border-color: #DC143C;
    color: #DC143C;
  }

  .disconnect-btn:hover:not(:disabled) {
    background: #ffdddd;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .pixel-wallet {
      padding: 10px;
    }
    
    .main-panel {
      padding: 20px;
      max-width: calc(100vw - 40px);
    }
    
    .main-panel .panel-title {
      font-size: 20px;
    }
    
    .welcome-message {
      font-size: 16px;
    }
    
    .start-game-btn {
      padding: 12px 24px;
      font-size: 14px;
      min-width: 180px;
    }
    
    .rule-item {
      font-size: 12px;
    }
  }
`