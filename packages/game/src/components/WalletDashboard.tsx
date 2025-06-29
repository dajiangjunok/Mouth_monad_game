import { useWeb3 } from '../hooks/useWeb3'
import { CONTRACT_CONFIG, type PlayerStatus } from '../contracts/config'

interface WalletDashboardProps {
  onNavigateToGame: () => void
  onNavigateToNFTs: () => void
  playerStatus?: PlayerStatus
  balance?: bigint
  hasSufficientBalance: boolean
}

export function WalletDashboard({ 
  onNavigateToGame, 
  onNavigateToNFTs, 
  playerStatus,
  balance,
  hasSufficientBalance
}: WalletDashboardProps) {
  const { address, isConnected, disconnect } = useWeb3()

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
  const formatScore = (score: bigint | undefined): string => {
    if (!score) return '0'
    try {
      return score.toString()
    } catch {
      return '0'
    }
  }

  if (!isConnected) {
    return (
      <div className="pixel-wallet">
        <div className="pixel-panel main-panel">
          <div className="panel-title">🐎 一起来嘴炮</div>
          <div className="welcome-message">欢迎来到嘴炮游戏！</div>
          <div className="connect-instruction">请连接钱包开始游戏</div>
        </div>
        <style>{pixelStyles}</style>
      </div>
    )
  }

  return (
    <div className="pixel-wallet">
      {/* Main Game-style Layout */}
      <div className="game-layout">
        {/* Left Side - Player Info */}
        <div className="left-panels">
          {/* Player Stats Panel */}
          <div className="pixel-panel player-panel">
            <div className="panel-title">🐎 一起来嘴炮</div>
            <div className="stat-row">
              <span className="stat-icon">❤️</span>
              <span className="stat-label">生命:</span>
              <span className="stat-value">3</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">⭐</span>
              <span className="stat-label">积分:</span>
              <span className="stat-value">{formatScore(playerStatus?.highestScore)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">关卡:</span>
              <span className="stat-value">1 / 20</span>
            </div>
          </div>

          {/* Wallet Info Panel */}
          <div className="pixel-panel wallet-panel">
            <div className="panel-title">💰 钱包状态</div>
            <div className="wallet-info">
              <div className="balance-display">
                余额: <span className="balance-amount">{formatBalance(balance)} MON</span>
              </div>
              <div className="wallet-address">
                地址: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          </div>

          {/* NFT Status Panel */}
          <div className="pixel-panel nft-panel">
            <div className="panel-title">🎖️ NFT收藏</div>
            <div className="nft-list">
              <div className="nft-item">
                <span className="nft-icon">{playerStatus?.mintedClosed ? '✅' : '❌'}</span>
                <span className="nft-name">闭嘴小马</span>
                {playerStatus?.canMintClosed && !playerStatus?.mintedClosed && (
                  <span className="can-mint">可获得!</span>
                )}
              </div>
              <div className="nft-item">
                <span className="nft-icon">{playerStatus?.mintedOpen ? '✅' : '❌'}</span>
                <span className="nft-name">张嘴小马</span>
                {playerStatus?.canMintOpen && !playerStatus?.mintedOpen && (
                  <span className="can-mint">可获得!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Main Game Area */}
        <div className="center-panel">
          <div className="pixel-panel main-game-panel">
            <div className="game-welcome">
              <div className="welcome-title">欢迎来到嘴炮游戏！</div>
              <div className="game-rules">
                <div className="rule-title">游戏规则:</div>
                <div className="rule-list">
                  <div className="rule-item">1. 观看第一排小马的示例表演</div>
                  <div className="rule-item">2. Go标记后，第二排开始模仿</div>
                  <div className="rule-item">3. 你控制YOU上的小马，按住空格键张嘴</div>
                  <div className="rule-item">4. 跟随示例的节奏，准确模仿张嘴时机和时长</div>
                  <div className="rule-item">5. 你有3次生命，出错会扣除生命</div>
                </div>
                <div className="rewards-info">
                  <div className="reward-title">🎯 奖励说明:</div>
                  <div className="reward-item">
                    <span className="reward-score">{CONTRACT_CONFIG.CLOSED_MOUTH_THRESHOLD}分</span>
                    <span className="reward-arrow"> → </span>
                    <span className="reward-desc">闭嘴小马NFT</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-score">{CONTRACT_CONFIG.OPEN_MOUTH_THRESHOLD}分</span>
                    <span className="reward-arrow"> → </span>
                    <span className="reward-desc">张嘴小马NFT</span>
                  </div>
                </div>
              </div>
              
              {/* Game Start Section */}
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
                  onClick={() => {
                    console.log('Pay and start game button clicked')
                    onNavigateToGame()
                  }}
                  disabled={!hasSufficientBalance}
                  className="pixel-btn start-game-btn"
                >
                  开始游戏
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Additional Controls */}
        <div className="right-panels">
          <div className="pixel-panel controls-panel">
            <div className="panel-title">🎮 游戏说明</div>
            <div className="control-info">
              <div className="control-item">1. 观看第一排小马的示例表演</div>
              <div className="control-item">2. Go标记后，第二排开始模仿</div>
              <div className="control-item">3. 你控制YOU上的小马</div>
              <div className="control-item">4. 按住空格键张嘴</div>
              <div className="control-item">5. 跟随示例的节奏</div>
            </div>
          </div>

          <div className="pixel-panel action-panel">
            <div className="panel-title">⚙️ 其他操作</div>
            <button 
              onClick={onNavigateToNFTs} 
              className="pixel-btn secondary-btn"
            >
              查看NFT收藏
            </button>
            <button 
              onClick={() => disconnect()} 
              className="pixel-btn disconnect-btn"
            >
              断开钱包
            </button>
          </div>
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
    overflow:auto;
  }

  .game-layout {
    width: 100%;
    max-width: 1200px;
    height: 100%;
    max-height: 800px;
    display: grid;
    grid-template-columns: 250px 1fr 250px;
    gap: 20px;
    background: #f5f5dc;
  }

  .left-panels, .right-panels {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .center-panel {
    display: flex;
    flex-direction: column;
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

  /* Player Stats Panel */
  .player-panel {
    padding: 0;
  }

  .stat-row {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #ccc;
    font-size: 14px;
  }

  .stat-row:last-child {
    border-bottom: none;
  }

  .stat-icon {
    margin-right: 8px;
    width: 16px;
  }

  .stat-label {
    margin-right: 8px;
    color: #333;
  }

  .stat-value {
    margin-left: auto;
    font-weight: bold;
    color: #000;
  }

  /* Wallet Panel */
  .wallet-panel {
    padding: 0;
  }

  .wallet-info {
    padding: 12px;
  }

  .balance-display, .wallet-address {
    margin: 8px 0;
    font-size: 12px;
    color: #333;
  }

  .balance-amount {
    font-weight: bold;
    color: #000;
  }

  /* NFT Panel */
  .nft-panel {
    padding: 0;
  }

  .nft-list {
    padding: 12px;
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

  /* Main Game Panel */
  .main-game-panel {
    padding: 0;
    flex: 1;
  }

  .game-welcome {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .welcome-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #000;
  }

  .game-rules {
    flex: 1;
    margin-bottom: 20px;
  }

  .rule-title, .reward-title {
    font-weight: bold;
    margin: 15px 0 10px 0;
    color: #000;
  }

  .rule-list {
    margin: 10px 0;
  }

  .rule-item {
    margin: 5px 0;
    padding: 3px 0;
    font-size: 13px;
    color: #333;
    line-height: 1.4;
  }

  .rewards-info {
    background: #f0f0f0;
    padding: 15px;
    margin: 15px 0;
    border: 2px solid #ccc;
  }

  .reward-item {
    display: flex;
    align-items: center;
    margin: 5px 0;
    font-size: 14px;
  }

  .reward-score {
    font-weight: bold;
    color: #000;
    margin-right: 5px;
  }

  .reward-arrow {
    color: #666;
    margin: 0 5px;
  }

  .reward-desc {
    color: #333;
  }

  /* Game Start Section */
  .game-start-section {
    text-align: center;
    padding: 20px 0;
    border-top: 2px solid #ccc;
    margin-top: auto;
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

  /* Controls Panel */
  .controls-panel, .action-panel {
    padding: 0;
  }

  .control-info {
    padding: 12px;
  }

  .control-item {
    margin: 6px 0;
    font-size: 11px;
    color: #333;
    line-height: 1.3;
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
    margin: 15px 0;
    min-width: 200px;
  }

  .secondary-btn, .disconnect-btn {
    padding: 10px 15px;
    font-size: 12px;
    margin: 5px 0;
    width: 100%;
  }

  .disconnect-btn {
    background: #ffcccc;
    border-color: #DC143C;
    color: #DC143C;
  }

  .disconnect-btn:hover:not(:disabled) {
    background: #ffdddd;
  }

  /* 响应式设计 */
  @media (max-width: 1000px) {
    .game-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
      gap: 15px;
    }
    
    .left-panels, .right-panels {
      flex-direction: row;
      gap: 15px;
    }
    
    .left-panels .pixel-panel, 
    .right-panels .pixel-panel {
      flex: 1;
      min-height: auto;
    }
    
    .pixel-wallet {
      padding: 10px;
    }
  }

  @media (max-width: 768px) {
    .left-panels, .right-panels {
      flex-direction: column;
    }
    
    .welcome-title {
      font-size: 18px;
    }
    
    .start-game-btn {
      padding: 12px 24px;
      font-size: 14px;
      min-width: 180px;
    }
    
    .rule-item, .control-item {
      font-size: 12px;
    }
  }
`


export default WalletDashboard